<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\SupabaseStorageService;
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
     * Return active products to React and Flutter.
     */
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->where('is_active', true)
            ->latest()
            ->get();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    /**
     * Receive multipart/form-data from React, upload the image to Supabase,
     * save its public URL, and return the product to both clients.
     *
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProduct($request, imageRequired: true);
        $uploadedImage = $this->storage->uploadProductImage($request->file('image'));

        try {
            $product = Product::create([
                ...$validated,
                'image_path' => $uploadedImage['path'],
                'image_url' => $uploadedImage['url'],
            ]);
        } catch (Throwable $exception) {
            // Do not leave an unused Storage object if the database insert fails.
            try {
                $this->storage->delete($uploadedImage['path']);
            } catch (Throwable $cleanupException) {
                Log::warning('Failed to clean up product image after database error.', [
                    'path' => $uploadedImage['path'],
                    'error' => $cleanupException->getMessage(),
                ]);
            }

            throw $exception;
        }

        return response()->json($product, 201);
    }

    /**
     * Update text fields and optionally replace the product image.
     * For a multipart update, React should POST with _method=PUT.
     *
     * @throws ValidationException
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validateProduct($request, isUpdate: true);
        $oldImagePath = $product->image_path;
        $newImage = null;

        if ($request->hasFile('image')) {
            $newImage = $this->storage->uploadProductImage($request->file('image'));
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
                    Log::warning('Failed to clean up replacement product image.', [
                        'path' => $newImage['path'],
                        'error' => $cleanupException->getMessage(),
                    ]);
                }
            }

            throw $exception;
        }

        if ($newImage !== null && $oldImagePath !== null) {
            try {
                $this->storage->delete($oldImagePath);
            } catch (Throwable $exception) {
                // The product update already succeeded. Log cleanup failure instead
                // of returning a false failure to the admin.
                Log::warning('Product updated, but the previous image was not deleted.', [
                    'product_id' => $product->id,
                    'path' => $oldImagePath,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $imagePath = $product->image_path;
        $product->delete();

        if ($imagePath !== null) {
            try {
                $this->storage->delete($imagePath);
            } catch (Throwable $exception) {
                Log::warning('Product deleted, but its Supabase image was not deleted.', [
                    'product_id' => $product->id,
                    'path' => $imagePath,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
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
            $request->merge(['name' => trim((string) $request->input('name'))]);
        }

        $requiredRules = $isUpdate ? ['sometimes', 'required'] : ['required'];
        $imageRules = $imageRequired
            ? ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']
            : ['sometimes', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

        $validator = Validator::make($request->all(), [
            'name' => [...$requiredRules, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => [...$requiredRules, 'numeric', 'min:0'],
            'stock' => [...$requiredRules, 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => $imageRules,
        ], [
            'image.required' => 'Please choose a product image.',
            'image.image' => 'The selected file must be a real image.',
            'image.mimes' => 'The image must be JPG, JPEG, PNG, or WEBP.',
            'image.max' => 'The product image must not be larger than 5 MB.',
        ]);

        $validated = $validator->validate();
        unset($validated['image']);

        return $validated;
    }
}
