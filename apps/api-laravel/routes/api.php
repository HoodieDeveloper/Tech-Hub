<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Services\SupabaseStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

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

// Public routes
Route::get('/products', [ProductController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Logged-in routes
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/products/{product}', [ProductController::class, 'show']);

    // Admin-only routes
    Route::middleware('admin')
        ->prefix('admin')
        ->group(function (): void {
            Route::get('/dashboard', AdminDashboardController::class);

            // User routes
            Route::get('/users', [
                AdminUserController::class,
                'index',
            ]);

            // Settings routes
            Route::get('/settings', [
                AdminSettingController::class,
                'index',
            ]);

            Route::put('/settings', [
                AdminSettingController::class,
                'update',
            ]);

            // Category routes
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

            // Product routes
            Route::get('/products', [
                ProductController::class,
                'adminIndex',
            ]);

            Route::post('/products', [
                ProductController::class,
                'store',
            ]);

            Route::match(
                ['put', 'patch', 'post'],
                '/products/{product}',
                [ProductController::class, 'update']
            );

            Route::delete('/products/{product}', [
                ProductController::class,
                'destroy',
            ]);
        });
});