<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\SupabaseStorageService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProductController extends Controller
{
    public function __construct(
        private readonly SupabaseStorageService $storage
    ) {
    }

    /**
     * Return active products to the customer website.
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('category:id,name,slug')
            ->where('is_active', true)
            ->when(
                $request->filled('search'),
                function ($query) use ($request): void {
                    $search = trim((string) $request->input('search'));

                    $query->where(function ($subQuery) use ($search): void {
                        $subQuery
                            ->where('name', 'ilike', '%' . $search . '%')
                            ->orWhere('description', 'ilike', '%' . $search . '%');
                    });
                }
            )
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where(
                    'category_id',
                    $request->integer('category_id')
                )
            )
            ->latest()
            ->get();

        return response()->json($products);
    }

    /**
     * Return all products to the admin dashboard.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('category:id,name,slug')
            ->when(
                $request->filled('search'),
                function ($query) use ($request): void {
                    $search = trim((string) $request->input('search'));

                    $query->where(function ($subQuery) use ($search): void {
                        $subQuery
                            ->where('name', 'ilike', '%' . $search . '%')
                            ->orWhere('description', 'ilike', '%' . $search . '%');
                    });
                }
            )
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where(
                    'category_id',
                    $request->integer('category_id')
                )
            )
            ->when(
                $request->filled('status'),
                function ($query) use ($request): void {
                    $status = (string) $request->input('status');

                    if ($status === 'active') {
                        $query->where('is_active', true);
                    }

                    if ($status === 'inactive') {
                        $query->where('is_active', false);
                    }

                    if ($status === 'out_of_stock') {
                        $query->where('stock', 0);
                    }

                    if ($status === 'low_stock') {
                        $query->whereBetween('stock', [1, 5]);
                    }
                }
            )
            ->latest()
            ->paginate(5)
            ->withQueryString();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(
            $product->load('category:id,name,slug')
        );
    }

    /**
     * Create a product and upload its image to Supabase Storage.
     *
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProduct(
            $request,
            imageRequired: true
        );

        try {
            $uploadedImage = $this->storage->uploadProductImage(
                $request->file('image')
            );
        } catch (RequestException $exception) {
            Log::error('Supabase product image upload failed.', [
                'status' => $exception->response?->status(),
                'response' => $exception->response?->json()
                    ?? $exception->response?->body(),
            ]);

            return response()->json([
                'message' => $this->storageErrorMessage($exception),
            ], 502);
        } catch (Throwable $exception) {
            Log::error(
                'Product image upload failed before Supabase accepted the request.',
                [
                    'error' => $exception->getMessage(),
                ]
            );

            return response()->json([
                'message' => (bool) config('app.debug')
                    ? $exception->getMessage()
                    : 'Laravel could not prepare the image upload.',
            ], 500);
        }

        try {
            $product = Product::create([
                ...$validated,
                'image_path' => $uploadedImage['path'],
                'image_url' => $uploadedImage['url'],
            ]);
        } catch (Throwable $exception) {
            try {
                $this->storage->delete($uploadedImage['path']);
            } catch (Throwable $cleanupException) {
                Log::warning(
                    'Failed to clean up product image after database error.',
                    [
                        'path' => $uploadedImage['path'],
                        'error' => $cleanupException->getMessage(),
                    ]
                );
            }

            throw $exception;
        }

        return response()->json(
            $product->load('category:id,name,slug'),
            201
        );
    }

    /**
     * Update a product and optionally replace its image.
     *
     * @throws ValidationException
     */
    public function update(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $this->validateProduct(
            $request,
            isUpdate: true
        );

        $oldImagePath = $product->image_path;
        $newImage = null;

        if ($request->hasFile('image')) {
            try {
                $newImage = $this->storage->uploadProductImage(
                    $request->file('image')
                );
            } catch (RequestException $exception) {
                Log::error(
                    'Supabase replacement product image upload failed.',
                    [
                        'status' => $exception->response?->status(),
                        'response' => $exception->response?->json()
                            ?? $exception->response?->body(),
                    ]
                );

                return response()->json([
                    'message' => $this->storageErrorMessage($exception),
                ], 502);
            }

            $validated['image_path'] = $newImage['path'];
            $validated['image_url'] = $newImage['url'];
        }

        try {
            $product->update($validated);
        } catch (Throwable $exception) {
            if ($newImage !== null) {
                try {
                    $this->storage->delete($newImage['path']);
                } catch (Throwable $cleanupException) {
                    Log::warning(
                        'Failed to clean up replacement product image.',
                        [
                            'path' => $newImage['path'],
                            'error' => $cleanupException->getMessage(),
                        ]
                    );
                }
            }

            throw $exception;
        }

        if ($newImage !== null && $oldImagePath !== null) {
            try {
                $this->storage->delete($oldImagePath);
            } catch (Throwable $exception) {
                Log::warning(
                    'Product updated, but the previous image was not deleted.',
                    [
                        'product_id' => $product->id,
                        'path' => $oldImagePath,
                        'error' => $exception->getMessage(),
                    ]
                );
            }
        }

        return response()->json(
            $product->fresh()->load('category:id,name,slug')
        );
    }

    public function destroy(Product $product): JsonResponse
    {
        $imagePath = $product->image_path;
        $product->delete();

        if ($imagePath !== null) {
            try {
                $this->storage->delete($imagePath);
            } catch (Throwable $exception) {
                Log::warning(
                    'Product deleted, but its Supabase image was not deleted.',
                    [
                        'product_id' => $product->id,
                        'path' => $imagePath,
                        'error' => $exception->getMessage(),
                    ]
                );
            }
        }

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }

    private function storageErrorMessage(
        RequestException $exception
    ): string {
        $response = $exception->response;
        $supabaseMessage = $response?->json('message');

        if (
            is_string($supabaseMessage)
            && $supabaseMessage !== ''
        ) {
            return 'Supabase Storage rejected the image upload: '
                . $supabaseMessage;
        }

        return 'Supabase Storage rejected the image upload. '
            . 'Check the Laravel Storage keys and bucket settings.';
    }

    /**
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    private function validateProduct(
        Request $request,
        bool $isUpdate = false,
        bool $imageRequired = false,
    ): array {
        if ($request->has('name')) {
            $request->merge([
                'name' => trim(
                    (string) $request->input('name')
                ),
            ]);
        }

        $requiredRules = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        $imageRules = $imageRequired
            ? [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ]
            : [
                'sometimes',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ];

        $validator = Validator::make(
            $request->all(),
            [
                'name' => [
                    ...$requiredRules,
                    'string',
                    'max:255',
                ],
                'description' => [
                    'nullable',
                    'string',
                ],
                'price' => [
                    ...$requiredRules,
                    'numeric',
                    'min:0',
                ],
                'stock' => [
                    ...$requiredRules,
                    'integer',
                    'min:0',
                ],
                'category_id' => [
                    ...$requiredRules,
                    'integer',
                    'exists:categories,id',
                ],
                'is_active' => [
                    'sometimes',
                    'boolean',
                ],
                'image' => $imageRules,
            ],
            [
                'category_id.required' => 'Please select a category.',
                'category_id.exists' => 'The selected category does not exist.',
                'image.required' => 'Please choose a product image.',
                'image.image' => 'The selected file must be a real image.',
                'image.mimes' => 'The image must be JPG, JPEG, PNG, or WEBP.',
                'image.max' => 'The product image must not be larger than 5 MB.',
            ]
        );

        $validated = $validator->validate();

        unset($validated['image']);

        return $validated;
    }
}