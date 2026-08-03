<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.supabase.url', 'https://example.supabase.co');
        config()->set('services.supabase.key', 'test-secret-key');
        config()->set('services.supabase.bucket', 'product-images');
    }

    public function test_web_can_upload_image_and_api_returns_public_url(): void
    {
        Http::fake([
            'https://example.supabase.co/storage/v1/object/product-images/products/*' => Http::response([
                'Id' => 'test-object-id',
                'Key' => 'product-images/products/test.png',
            ], 200),
        ]);

        $response = $this->post('/api/products', [
            'name' => 'Test Laptop',
            'description' => 'Shared image test product',
            'price' => '899.99',
            'stock' => '4',
            'is_active' => '1',
            'image' => $this->tinyPng('laptop.png'),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'Test Laptop')
            ->assertJsonPath('stock', 4);

        $imageUrl = (string) $response->json('image_url');

        $this->assertStringStartsWith(
            'https://example.supabase.co/storage/v1/object/public/product-images/products/',
            $imageUrl
        );
        $this->assertStringEndsWith('.png', $imageUrl);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Laptop',
            'image_url' => $imageUrl,
        ]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('0.image_url', $imageUrl);

        Http::assertSent(function ($request): bool {
            return $request->method() === 'POST'
                && str_starts_with(
                    $request->url(),
                    'https://example.supabase.co/storage/v1/object/product-images/products/'
                )
                && $request->hasHeader('apikey', 'test-secret-key')
                && $request->hasHeader('Authorization', 'Bearer test-secret-key')
                && $request->hasHeader('Content-Type', 'image/png');
        });
    }

    public function test_image_is_required_when_creating_a_product(): void
    {
        $response = $this->postJson('/api/products', [
            'name' => 'Product Without Image',
            'price' => 10,
            'stock' => 1,
            'is_active' => true,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_non_image_file_is_rejected(): void
    {
        $response = $this->post('/api/products', [
            'name' => 'Invalid Image Product',
            'price' => '10',
            'stock' => '1',
            'image' => UploadedFile::fake()->createWithContent(
                'not-an-image.txt',
                'This is not an image.'
            ),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_inactive_products_are_not_returned_in_product_list(): void
    {
        Product::create([
            'name' => 'Hidden Product',
            'price' => 15,
            'stock' => 2,
            'is_active' => false,
        ]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(0);
    }

    private function tinyPng(string $name): UploadedFile
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',
            true
        );

        return UploadedFile::fake()->createWithContent($name, $png ?: '');
    }
}
