<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SupabaseStorageService
{
    private string $url;
    private string $apiKey;
    private string $authorizationToken;
    private string $bucket;

    public function __construct()
    {
        $this->url = rtrim(
            (string) config('services.supabase.url'),
            '/'
        );

        $secretKey = trim(
            (string) config('services.supabase.secret_key')
        );

        $serviceRoleKey = trim(
            (string) config('services.supabase.service_role_key')
        );

        // Prefer the newer opaque secret key in the apikey header.
        // Storage REST still uses the service_role JWT for Authorization.
        $this->apiKey = $secretKey !== ''
            ? $secretKey
            : $serviceRoleKey;

        $this->authorizationToken = $serviceRoleKey;

        $this->bucket = trim(
            (string) config(
                'services.supabase.storage_bucket',
                'product-images'
            )
        );
    }

    /**
     * Non-secret values safe for diagnostics.
     *
     * @return array<string, bool|string>
     */
    public function diagnostics(): array
    {
        return [
            'url_configured' => $this->url !== '',
            'api_key_configured' => $this->apiKey !== '',
            'service_role_configured' =>
                $this->authorizationToken !== '',
            'service_role_looks_like_jwt' =>
                count(
                    explode(
                        '.',
                        $this->authorizationToken
                    )
                ) === 3,
            'bucket' => $this->bucket,
        ];
    }

    private function request(): PendingRequest
    {
        $this->assertConfigured();

        return Http::acceptJson()
            ->timeout(30)
            ->retry(2, 250)
            ->withHeaders([
                'apikey' => $this->apiKey,
                'Authorization' =>
                    'Bearer '.$this->authorizationToken,
            ]);
    }

    private function assertConfigured(): void
    {
        if ($this->url === '') {
            throw new RuntimeException(
                'SUPABASE_URL is missing from Laravel .env.'
            );
        }

        if ($this->apiKey === '') {
            throw new RuntimeException(
                'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY '
                .'is missing from Laravel .env.'
            );
        }

        if ($this->authorizationToken === '') {
            throw new RuntimeException(
                'SUPABASE_SERVICE_ROLE_KEY is missing from Laravel .env. '
                .'This Storage REST implementation needs the legacy '
                .'service_role JWT for Authorization.'
            );
        }

        if (
            count(
                explode(
                    '.',
                    $this->authorizationToken
                )
            ) !== 3
        ) {
            throw new RuntimeException(
                'SUPABASE_SERVICE_ROLE_KEY does not look like a JWT. '
                .'Copy the legacy service_role key that begins with eyJ.'
            );
        }

        if ($this->bucket === '') {
            throw new RuntimeException(
                'SUPABASE_STORAGE_BUCKET is missing from Laravel .env.'
            );
        }
    }

    /**
     * Upload a product image.
     *
     * @return array{path: string, url: string}
     *
     * @throws RequestException
     */
    public function uploadProductImage(
        UploadedFile $image
    ): array {
        $path = sprintf(
            'products/%s/%s/%s',
            now()->format('Y'),
            now()->format('m'),
            $this->generateFilename($image)
        );

        return $this->uploadImage(
            $image,
            $path
        );
    }

    /**
     * Upload a customer profile picture.
     *
     * @return array{path: string, url: string}
     *
     * @throws RequestException
     */
    public function uploadUserAvatar(
        UploadedFile $image
    ): array {
        $path = sprintf(
            'users/avatars/%s/%s/%s',
            now()->format('Y'),
            now()->format('m'),
            $this->generateFilename($image)
        );

        return $this->uploadImage(
            $image,
            $path
        );
    }

    /**
     * Upload the shop/store logo.
     *
     * @return array{path: string, url: string}
     *
     * @throws RequestException
     */
    public function uploadStoreLogo(
        UploadedFile $image
    ): array {
        $path = sprintf(
            'settings/logo/%s',
            $this->generateFilename($image)
        );

        return $this->uploadImage(
            $image,
            $path
        );
    }

    /**
     * Upload an image to Supabase Storage.
     *
     * @return array{path: string, url: string}
     *
     * @throws RequestException
     */
    private function uploadImage(
        UploadedFile $image,
        string $path
    ): array {
        $mimeType =
            $image->getMimeType()
            ?: 'application/octet-stream';

        $contents = file_get_contents(
            $image->getRealPath()
        );

        if ($contents === false) {
            throw new RuntimeException(
                'Laravel could not read the uploaded image file.'
            );
        }

        $response = $this->request()
            ->withHeaders([
                'Content-Type' => $mimeType,
                'x-upsert' => 'false',
            ])
            ->withBody(
                $contents,
                $mimeType
            )
            ->post(
                $this->objectUrl($path)
            );

        $response->throw();

        return [
            'path' => $path,
            'url' => $this->publicUrl($path),
        ];
    }

    /**
     * Generate a unique filename.
     */
    private function generateFilename(
        UploadedFile $image
    ): string {
        $extension = strtolower(
            $image->extension() ?: 'jpg'
        );

        return Str::uuid().'.'.$extension;
    }

    /**
     * Delete a file from Supabase Storage.
     *
     * @throws RequestException
     */
    public function delete(
        string $path
    ): void {
        $path = trim(
            $path,
            '/'
        );

        if ($path === '') {
            return;
        }

        $response = $this->request()
            ->withBody(
                json_encode(
                    [
                        'prefixes' => [
                            $path,
                        ],
                    ],
                    JSON_THROW_ON_ERROR
                ),
                'application/json'
            )
            ->delete(
                sprintf(
                    '%s/storage/v1/object/%s',
                    $this->url,
                    rawurlencode(
                        $this->bucket
                    )
                )
            );

        $response->throw();
    }

    private function objectUrl(
        string $path
    ): string {
        return sprintf(
            '%s/storage/v1/object/%s/%s',
            $this->url,
            rawurlencode(
                $this->bucket
            ),
            $this->encodePath(
                $path
            )
        );
    }

    private function publicUrl(
        string $path
    ): string {
        return sprintf(
            '%s/storage/v1/object/public/%s/%s',
            $this->url,
            rawurlencode(
                $this->bucket
            ),
            $this->encodePath(
                $path
            )
        );
    }

    private function encodePath(
        string $path
    ): string {
        return implode(
            '/',
            array_map(
                'rawurlencode',
                explode(
                    '/',
                    trim(
                        $path,
                        '/'
                    )
                )
            )
        );
    }
}