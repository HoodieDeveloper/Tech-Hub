<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set(
            'services.supabase.url',
            'https://example.supabase.co'
        );

        config()->set(
            'services.supabase.secret_key',
            'sb_secret_test-key'
        );

        config()->set(
            'services.supabase.service_role_key',
            'header.payload.signature'
        );

        config()->set(
            'services.supabase.storage_bucket',
            'product-images'
        );
    }

    public function test_guests_can_browse_active_products(): void
    {
        Product::create([
            'name' => 'Public Laptop',
            'price' => 899,
            'stock' => 3,
            'is_active' => true,
        ]);

        Product::create([
            'name' => 'Hidden Product',
            'price' => 15,
            'stock' => 2,
            'is_active' => false,
        ]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', 'Public Laptop');
    }

    public function test_product_details_require_login(): void
    {
        $product = Product::create([
            'name' => 'Protected Details',
            'price' => 100,
            'stock' => 1,
            'is_active' => true,
        ]);

        $this->getJson("/api/products/{$product->id}")
            ->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('name', 'Protected Details');
    }

    public function test_admin_can_upload_image_and_api_returns_public_url(): void
    {
        $this->actingAsAdmin();

        $category = $this->createCategory();

        Http::fake([
            'https://example.supabase.co/storage/v1/object/product-images/products/*'
                => Http::response([
                    'Id' => 'test-object-id',
                    'Key' => 'product-images/products/test.png',
                ], 200),
        ]);

        $response = $this->post('/api/admin/products', [
            'name' => 'Test Laptop',
            'description' => 'Shared image test product',
            'price' => '899.99',
            'stock' => '4',
            'category_id' => (string) $category->id,
            'is_active' => '1',
            'image' => $this->tinyPng('laptop.png'),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'Test Laptop')
            ->assertJsonPath('stock', 4)
            ->assertJsonPath('category.id', $category->id)
            ->assertJsonPath('category.name', 'Laptops');

        $imageUrl = (string) $response->json('image_url');

        $this->assertStringStartsWith(
            'https://example.supabase.co/storage/v1/object/public/product-images/products/',
            $imageUrl
        );

        $this->assertDatabaseHas('products', [
            'name' => 'Test Laptop',
            'category_id' => $category->id,
            'image_url' => $imageUrl,
        ]);

        Http::assertSent(function ($request): bool {
            return $request->method() === 'POST'
                && str_starts_with(
                    $request->url(),
                    'https://example.supabase.co/storage/v1/object/product-images/products/'
                )
                && $request->hasHeader(
                    'apikey',
                    'sb_secret_test-key'
                )
                && $request->hasHeader(
                    'Authorization',
                    'Bearer header.payload.signature'
                );
        });
    }

    public function test_customer_cannot_manage_products(): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
        ]));

        $this->postJson('/api/admin/products', [
            'name' => 'Forbidden Product',
            'price' => 10,
            'stock' => 1,
        ])->assertForbidden();
    }

    public function test_image_is_required_when_admin_creates_a_product(): void
    {
        $this->actingAsAdmin();

        $category = $this->createCategory();

        $this->postJson('/api/admin/products', [
            'name' => 'Product Without Image',
            'price' => 10,
            'stock' => 1,
            'category_id' => $category->id,
            'is_active' => true,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_non_image_file_is_rejected(): void
    {
        $this->actingAsAdmin();

        $category = $this->createCategory();

        $this->post('/api/admin/products', [
            'name' => 'Invalid Image Product',
            'price' => '10',
            'stock' => '1',
            'category_id' => (string) $category->id,
            'image' => UploadedFile::fake()->createWithContent(
                'not-an-image.txt',
                'This is not an image.'
            ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_health_endpoint_reports_safe_storage_configuration(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath(
                'storage.api_key_configured',
                true
            )
            ->assertJsonPath(
                'storage.service_role_configured',
                true
            )
            ->assertJsonPath(
                'storage.service_role_looks_like_jwt',
                true
            )
            ->assertJsonPath(
                'storage.bucket',
                'product-images'
            );
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        Sanctum::actingAs($admin);

        return $admin;
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Laptops',
            'slug' => 'laptops',
            'description' => 'Laptop computers',
            'is_active' => true,
        ]);
    }

    private function tinyPng(string $name): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
            true
        );

        return UploadedFile::fake()->createWithContent(
            $name,
            $png ?: ''
        );
    }
}