<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
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
            'settings' => $settings,
        ]);
    }

    /**
     * Update the website settings.
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
}