<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SupabaseStorageService
{
    private string $url;

    private string $key;

    private string $bucket;

    public function __construct()
    {
        $this->url = rtrim((string) config('services.supabase.url'), '/');
        $this->key = trim((string) config('services.supabase.key'));
        $this->bucket = trim((string) config('services.supabase.bucket', 'product-images'));
    }

    /**
     * Upload one product image and return the object path and public URL.
     *
     * @return array{path: string, url: string}
     */
    public function uploadProductImage(UploadedFile $image): array
    {
        $this->ensureConfigured();
        $extension = strtolower($image->extension() ?: 'jpg');
        $path = sprintf(
            'products/%s/%s.%s',
            now()->format('Y/m'),
            Str::uuid()->toString(),
            $extension
        );

        $contents = $image->get();

        $response = $this->request()
            ->withHeaders([
                'Content-Type' => $image->getMimeType() ?: 'application/octet-stream',
                'Cache-Control' => 'max-age=31536000',
                'x-upsert' => 'true',
            ])
            ->withBody($contents, $image->getMimeType() ?: 'application/octet-stream')
            ->post($this->objectUrl($path));

        if (! $response->successful()) {
            $message = $response->json('message')
                ?? $response->json('error')
                ?? $response->body();

            throw new RuntimeException(
                'Supabase could not upload the product image: '.trim((string) $message)
            );
        }

        return [
            'path' => $path,
            'url' => $this->publicUrl($path),
        ];
    }

    /**
     * Delete an object from Supabase Storage.
     */
    public function delete(?string $path): void
    {
        if ($path === null || trim($path) === '') {
            return;
        }

        $this->ensureConfigured();

        $response = $this->request()
            ->withBody(json_encode([
                'prefixes' => [ltrim($path, '/')],
            ], JSON_THROW_ON_ERROR), 'application/json')
            ->delete($this->storageBaseUrl().'/object/'.rawurlencode($this->bucket));

        if (! $response->successful()) {
            $message = $response->json('message')
                ?? $response->json('error')
                ?? $response->body();

            throw new RuntimeException(
                'Supabase could not delete the product image: '.trim((string) $message)
            );
        }
    }

    private function ensureConfigured(): void
    {
        if ($this->url === '' || $this->key === '' || $this->bucket === '') {
            throw new RuntimeException(
                'Supabase Storage is not configured. Add SUPABASE_URL, '
                .'SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), and '
                .'SUPABASE_STORAGE_BUCKET to the Laravel .env file.'
            );
        }
    }

private function request(): PendingRequest
{
    return Http::acceptJson()
        ->timeout(30)
        ->retry(2, 250)
        ->withHeaders([
            'apikey' => $this->key,
        ]);
}

    private function objectUrl(string $path): string
    {
        return $this->storageBaseUrl()
            .'/object/'
            .rawurlencode($this->bucket)
            .'/'.$this->encodePath($path);
    }

    private function publicUrl(string $path): string
    {
        return $this->storageBaseUrl()
            .'/object/public/'
            .rawurlencode($this->bucket)
            .'/'.$this->encodePath($path);
    }

    private function storageBaseUrl(): string
    {
        return $this->url.'/storage/v1';
    }

    private function encodePath(string $path): string
    {
        return implode(
            '/',
            array_map('rawurlencode', explode('/', ltrim($path, '/')))
        );
    }
}
