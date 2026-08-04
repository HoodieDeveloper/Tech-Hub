<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'products' => Product::query()->count(),
            'active_products' => Product::query()->where('is_active', true)->count(),
            'out_of_stock_products' => Product::query()->where('stock', '<=', 0)->count(),
            'customers' => User::query()->where('role', User::ROLE_CUSTOMER)->count(),
            'admins' => User::query()->where('role', User::ROLE_ADMIN)->count(),
        ]);
    }
}
