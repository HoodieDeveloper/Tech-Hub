<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseStorageService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly SupabaseStorageService $storage
    ) {
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],

            'avatar' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ], [
            'avatar.image' =>
                'The profile picture must be a real image.',

            'avatar.mimes' =>
                'The profile picture must be JPG, JPEG, PNG, or WEBP.',

            'avatar.max' =>
                'The profile picture must not be larger than 5 MB.',
        ]);

        $uploadedAvatar = null;

        /*
         * Upload profile picture to Supabase Storage
         * when the customer selected one.
         */
        if ($request->hasFile('avatar')) {
            try {
                $uploadedAvatar =
                    $this->storage->uploadUserAvatar(
                        $request->file('avatar')
                    );
            } catch (RequestException $exception) {
                Log::error(
                    'Supabase user avatar upload failed.',
                    [
                        'status' =>
                            $exception->response?->status(),

                        'response' =>
                            $exception->response?->json()
                            ?? $exception->response?->body(),
                    ]
                );

                return response()->json([
                    'message' =>
                        'Unable to upload the profile picture.',
                ], 502);
            } catch (Throwable $exception) {
                Log::error(
                    'User avatar upload failed.',
                    [
                        'error' =>
                            $exception->getMessage(),
                    ]
                );

                return response()->json([
                    'message' =>
                        'Laravel could not upload the profile picture.',
                ], 500);
            }
        }

        try {
            $userData = [
                'name' =>
                    trim($validated['name']),

                'email' =>
                    strtolower(
                        trim($validated['email'])
                    ),

                'password' =>
                    $validated['password'],

                /*
                 * Public registration can only
                 * create customer accounts.
                 */
                'role' =>
                    User::ROLE_CUSTOMER,
            ];

            if ($uploadedAvatar !== null) {
                $userData['avatar_url'] =
                    $uploadedAvatar['url'];

                $userData['avatar_path'] =
                    $uploadedAvatar['path'];
            }

            $user = User::create(
                $userData
            );
        } catch (Throwable $exception) {
            /*
             * If database creation fails after
             * the image was uploaded, remove the
             * unused image from Supabase.
             */
            if ($uploadedAvatar !== null) {
                try {
                    $this->storage->delete(
                        $uploadedAvatar['path']
                    );
                } catch (Throwable $cleanupException) {
                    Log::warning(
                        'Failed to clean up user avatar after registration error.',
                        [
                            'path' =>
                                $uploadedAvatar['path'],

                            'error' =>
                                $cleanupException->getMessage(),
                        ]
                    );
                }
            }

            throw $exception;
        }

        return response()->json(
            $this->authPayload($user),
            201
        );
    }

    /**
     * Admins and customers use this same login endpoint.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::query()
            ->where(
                'email',
                strtolower(
                    trim($validated['email'])
                )
            )
            ->first();

        if (
            ! $user ||
            ! Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'The provided email or password is incorrect.',
                ],
            ]);
        }

        return response()->json(
            $this->authPayload($user)
        );
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' =>
                $this->userData(
                    $request->user()
                ),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $user = $request->user();
        $uploadedAvatar = $this->storage->uploadUserAvatar($validated['avatar']);
        $oldAvatarPath = $user->avatar_path;

        $user->update([
            'avatar_url' => $uploadedAvatar['url'],
            'avatar_path' => $uploadedAvatar['path'],
        ]);

        if ($oldAvatarPath !== null) {
            try {
                $this->storage->delete($oldAvatarPath);
            } catch (Throwable $exception) {
                Log::warning('Failed to delete previous user avatar.', [
                    'path' => $oldAvatarPath,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'user' => $this->userData($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()
            ?->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' =>
                'Logged out successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function authPayload(User $user): array
    {
        return [
            'token' =>
                $user
                    ->createToken(
                        'tech-hub-client'
                    )
                    ->plainTextToken,

            'user' =>
                $this->userData($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function userData(?User $user): array
    {
        abort_if(
            $user === null,
            401,
            'Unauthenticated.'
        );

        return [
            'id' =>
                $user->id,

            'name' =>
                $user->name,

            'email' =>
                $user->email,

            'role' =>
                $user->role,

            'avatar_url' =>
                $user->avatar_url,
        ];
    }
}