<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WishlistController;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Test Routes
|--------------------------------------------------------------------------
*/

Route::get('/test', fn () => response()->json([
    'message' => 'API is working',
]));

Route::get('/health', function (SupabaseStorageService $storage) {
    try {
        DB::select('select 1');

        $database = 'connected';
    } catch (\Throwable) {
        $database = 'failed';
    }

    return response()->json([
        'status' => 'ok',
        'environment' => app()->environment(),
        'database' => $database,
        'storage' => $storage->diagnostics(),
    ]);
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/products', [
    ProductController::class,
    'index',
]);
Route::get(
    '/products/best-sellers',
    [ProductController::class, 'bestSellers']
);
Route::get('/products/{product}', [
    ProductController::class,
    'show',
]);

Route::get('/categories', [
    CategoryController::class,
    'index',
]);

Route::post('/register', [
    AuthController::class,
    'register',
]);

Route::post('/login', [
    AuthController::class,
    'login',
]);

/*
|--------------------------------------------------------------------------
| Logged-in Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function (): void {

    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [
        AuthController::class,
        'me',
    ]);

    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Customer Orders
    |--------------------------------------------------------------------------
    */

    Route::get('/orders', [
        OrderController::class,
        'index',
    ]);

    Route::post('/orders', [
        OrderController::class,
        'store',
    ]);

    Route::get('/orders/{order}', [
        OrderController::class,
        'show',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Customer Wishlist
    |--------------------------------------------------------------------------
    */

    Route::get('/wishlist', [
        WishlistController::class,
        'index',
    ]);

    Route::post('/wishlist/{product}', [
        WishlistController::class,
        'store',
    ]);

    Route::delete('/wishlist/{product}', [
        WishlistController::class,
        'destroy',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Customer Cart
    |--------------------------------------------------------------------------
    */

    Route::get('/cart', [
        CartController::class,
        'index',
    ]);

    Route::post('/cart/{product}', [
        CartController::class,
        'store',
    ]);

    Route::put('/cart/{product}', [
        CartController::class,
        'update',
    ]);

    Route::delete('/cart/{product}', [
        CartController::class,
        'destroy',
    ]);

    Route::delete('/cart', [
        CartController::class,
        'clear',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Admin-only Routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('admin')
        ->prefix('admin')
        ->group(function (): void {

            /*
            |--------------------------------------------------------------------------
            | Admin Dashboard
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/dashboard',
                AdminDashboardController::class
            );

            /*
            |--------------------------------------------------------------------------
            | Admin Users
            |--------------------------------------------------------------------------
            */

            Route::get('/users', [
                AdminUserController::class,
                'index',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Admin Settings
            |--------------------------------------------------------------------------
            */

            Route::get('/settings', [
                AdminSettingController::class,
                'index',
            ]);

            Route::put('/settings', [
                AdminSettingController::class,
                'update',
            ]);

            Route::post('/settings/logo', [
                AdminSettingController::class,
                'uploadLogo',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Admin Categories
            |--------------------------------------------------------------------------
            */

            Route::get('/categories', [
                CategoryController::class,
                'index',
            ]);

            Route::post('/categories', [
                CategoryController::class,
                'store',
            ]);

            Route::patch('/categories/{category}', [
                CategoryController::class,
                'update',
            ]);

            Route::delete('/categories/{category}', [
                CategoryController::class,
                'destroy',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Admin Products
            |--------------------------------------------------------------------------
            */

            Route::get('/products', [
                ProductController::class,
                'adminIndex',
            ]);

            Route::post('/products', [
                ProductController::class,
                'store',
            ]);

            Route::match(
                [
                    'put',
                    'patch',
                    'post',
                ],
                '/products/{product}',
                [
                    ProductController::class,
                    'update',
                ]
            );

            Route::delete('/products/{product}', [
                ProductController::class,
                'destroy',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Admin Orders
            |--------------------------------------------------------------------------
            */

            Route::get('/orders', [
                AdminOrderController::class,
                'index',
            ]);

            Route::get('/customers/{user}/orders', [
                AdminOrderController::class,
                'customerHistory',
            ]);

            Route::patch('/orders/{order}/status', [
                AdminOrderController::class,
                'updateStatus',
            ]);

            Route::patch('/orders/{order}/payment-status', [
                AdminOrderController::class,
                'updatePaymentStatus',
            ]);
        });
});