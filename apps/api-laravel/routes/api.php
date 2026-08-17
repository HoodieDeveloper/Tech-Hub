<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
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
|
| These routes do NOT require login.
|
*/

/*
 * Get all public products.
 */
Route::get('/products', [
    ProductController::class,
    'index',
]);

/*
 * Get one product detail.
 *
 * PUBLIC:
 * Customer does not need to login
 * just to view product information.
 */
Route::get('/products/{product}', [
    ProductController::class,
    'show',
]);

/*
 * Get public categories.
 */
Route::get('/categories', [
    CategoryController::class,
    'index',
]);

/*
 * Customer registration.
 */
Route::post('/register', [
    AuthController::class,
    'register',
]);

/*
 * Customer/Admin login.
 */
Route::post('/login', [
    AuthController::class,
    'login',
]);

/*
|--------------------------------------------------------------------------
| Logged-in Routes
|--------------------------------------------------------------------------
|
| Everything inside this group requires
| a valid Laravel Sanctum token.
|
*/

Route::middleware('auth:sanctum')->group(function (): void {

    /*
     * Current logged-in user.
     */
    Route::get('/me', [
        AuthController::class,
        'me',
    ]);

    /*
     * Logout.
     */
    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Customer Order Routes
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
    | Customer Wishlist Routes
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
    | Customer Cart Routes
    |--------------------------------------------------------------------------
    */

    /*
     * Get logged-in customer's cart.
     */
    Route::get('/cart', [
        CartController::class,
        'index',
    ]);

    /*
     * Add product to cart.
     */
    Route::post('/cart/{product}', [
        CartController::class,
        'store',
    ]);

    /*
     * Update product quantity.
     */
    Route::put('/cart/{product}', [
        CartController::class,
        'update',
    ]);

    /*
     * Remove one product from cart.
     */
    Route::delete('/cart/{product}', [
        CartController::class,
        'destroy',
    ]);

    /*
     * Clear entire cart.
     */
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
             * Dashboard.
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
        });
});