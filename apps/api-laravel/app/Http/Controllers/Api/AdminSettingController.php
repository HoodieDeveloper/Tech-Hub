<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\SupabaseStorageService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class AdminSettingController extends Controller
{
    public function __construct(
        private readonly SupabaseStorageService $storage
    ) {
    }

    /**
     * Return the website settings.
     */
    public function index(): JsonResponse
    {
        $settings = SiteSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'store_name' => 'TechHub',
                'currency' => 'USD',
                'language' => 'English',
                'timezone' => 'Asia/Phnom_Penh',
                'date_format' => 'M d, Y',
                'new_order_alerts' => true,
                'low_stock_alerts' => true,
                'daily_sales_summary' => true,
            ]
        );

        return response()->json([
            'settings' => $settings->fresh(),
        ]);
    }

    /**
     * Update normal website settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => [
                'required',
                'string',
                'max:255',
            ],

            'store_email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'store_address' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'currency' => [
                'required',
                'string',
                'max:10',
            ],

            'language' => [
                'required',
                'string',
                'max:50',
            ],

            'timezone' => [
                'required',
                'string',
                'max:100',
            ],

            'date_format' => [
                'required',
                'string',
                'max:30',
            ],

            'new_order_alerts' => [
                'required',
                'boolean',
            ],

            'low_stock_alerts' => [
                'required',
                'boolean',
            ],

            'daily_sales_summary' => [
                'required',
                'boolean',
            ],
        ]);

        $settings = SiteSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'store_name' => 'TechHub',
            ]
        );

        $settings->update($validated);

        return response()->json([
            'message' => 'Website settings updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }

    /**
     * Upload or replace the shop logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ], [
            'logo.required' => 'Please choose a shop logo.',
            'logo.image' => 'The shop logo must be a real image.',
            'logo.mimes' => 'The shop logo must be JPG, JPEG, PNG, or WEBP.',
            'logo.max' => 'The shop logo must not be larger than 5 MB.',
        ]);

        $settings = SiteSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'store_name' => 'TechHub',
            ]
        );

        $oldLogoPath = $settings->logo_path;

        try {
            $newLogo = $this->storage->uploadStoreLogo(
                $request->file('logo')
            );
        } catch (RequestException $exception) {
            Log::error('Supabase store logo upload failed.', [
                'status' => $exception->response?->status(),
                'response' => $exception->response?->json()
                    ?? $exception->response?->body(),
            ]);

            return response()->json([
                'message' => 'Supabase Storage rejected the shop logo upload.',
            ], 502);
        } catch (Throwable $exception) {
            Log::error('Store logo upload failed.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Laravel could not upload the shop logo.',
            ], 500);
        }

        try {
            $settings->update([
                'logo_url' => $newLogo['url'],
                'logo_path' => $newLogo['path'],
            ]);
        } catch (Throwable $exception) {
            try {
                $this->storage->delete(
                    $newLogo['path']
                );
            } catch (Throwable $cleanupException) {
                Log::warning(
                    'Failed to clean up new logo after database error.',
                    [
                        'path' => $newLogo['path'],
                        'error' => $cleanupException->getMessage(),
                    ]
                );
            }

            throw $exception;
        }

        /*
         * Delete the previous logo only after
         * the new logo has been saved successfully.
         */
        if (
            is_string($oldLogoPath) &&
            $oldLogoPath !== ''
        ) {
            try {
                $this->storage->delete(
                    $oldLogoPath
                );
            } catch (Throwable $exception) {
                Log::warning(
                    'New logo saved, but old logo could not be deleted.',
                    [
                        'path' => $oldLogoPath,
                        'error' => $exception->getMessage(),
                    ]
                );
            }
        }

        return response()->json([
            'message' => 'Shop logo updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }
}