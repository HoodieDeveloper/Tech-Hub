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
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly SupabaseStorageService $storage
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Register
    |--------------------------------------------------------------------------
    */

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
         * Upload profile picture to
         * Supabase Storage if selected.
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
             * Database failed after upload.
             * Remove unused uploaded avatar.
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

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    /**
     * Admins and customers use
     * this same login endpoint.
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

    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' =>
                $this->userData(
                    $request->user()
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Profile
    |--------------------------------------------------------------------------
    |
    | Customer can update:
    |
    | - Name
    | - Email
    | - Profile picture
    |
    | Password is NOT returned or displayed.
    |
    */

    public function updateProfile(
        Request $request
    ): JsonResponse {
        /** @var User|null $user */
        $user = $request->user();

        abort_if(
            $user === null,
            401,
            'Unauthenticated.'
        );

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

                Rule::unique(
                    'users',
                    'email'
                )->ignore(
                    $user->id
                ),
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

        /*
         * Keep the old avatar path.
         *
         * If a new avatar is uploaded
         * successfully, we delete the old
         * one after the database update.
         */
        $oldAvatarPath =
            $user->avatar_path;

        $uploadedAvatar = null;

        /*
         * Upload new avatar if the
         * customer selected one.
         */
        if ($request->hasFile('avatar')) {
            try {
                $uploadedAvatar =
                    $this->storage->uploadUserAvatar(
                        $request->file('avatar')
                    );
            } catch (RequestException $exception) {
                Log::error(
                    'Supabase profile avatar update failed.',
                    [
                        'user_id' =>
                            $user->id,

                        'status' =>
                            $exception->response?->status(),

                        'response' =>
                            $exception->response?->json()
                            ?? $exception->response?->body(),
                    ]
                );

                return response()->json([
                    'message' =>
                        'Unable to upload the new profile picture.',
                ], 502);
            } catch (Throwable $exception) {
                Log::error(
                    'Profile avatar update failed.',
                    [
                        'user_id' =>
                            $user->id,

                        'error' =>
                            $exception->getMessage(),
                    ]
                );

                return response()->json([
                    'message' =>
                        'Laravel could not upload the new profile picture.',
                ], 500);
            }
        }

        try {
            /*
             * Update name and email.
             */
            $user->name =
                trim(
                    $validated['name']
                );

            $user->email =
                strtolower(
                    trim(
                        $validated['email']
                    )
                );

            /*
             * Only replace avatar when
             * a new image was uploaded.
             */
            if ($uploadedAvatar !== null) {
                $user->avatar_url =
                    $uploadedAvatar['url'];

                $user->avatar_path =
                    $uploadedAvatar['path'];
            }

            $user->save();
        } catch (Throwable $exception) {
            /*
             * Database save failed.
             *
             * Remove the newly uploaded
             * avatar so it does not remain
             * unused in Supabase Storage.
             */
            if ($uploadedAvatar !== null) {
                try {
                    $this->storage->delete(
                        $uploadedAvatar['path']
                    );
                } catch (Throwable $cleanupException) {
                    Log::warning(
                        'Failed to clean up new profile avatar after update error.',
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

        /*
         * Database update succeeded.
         *
         * Now remove the customer's
         * previous avatar from Supabase.
         */
        if (
            $uploadedAvatar !== null &&
            $oldAvatarPath &&
            $oldAvatarPath !==
                $uploadedAvatar['path']
        ) {
            try {
                $this->storage->delete(
                    $oldAvatarPath
                );
            } catch (Throwable $exception) {
                /*
                 * Profile update already
                 * succeeded, so do not fail
                 * the request just because
                 * old-image cleanup failed.
                 */
                Log::warning(
                    'Failed to delete old profile avatar.',
                    [
                        'user_id' =>
                            $user->id,

                        'path' =>
                            $oldAvatarPath,

                        'error' =>
                            $exception->getMessage(),
                    ]
                );
            }
        }

        /*
         * Refresh values from database.
         */
        $user->refresh();

        return response()->json([
            'message' =>
                'Profile updated successfully.',

            'user' =>
                $this->userData(
                    $user
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Authentication Payload
    |--------------------------------------------------------------------------
    */

    /**
     * @return array<string, mixed>
     */
    private function authPayload(
        User $user
    ): array {
        return [
            'token' =>
                $user
                    ->createToken(
                        'tech-hub-client'
                    )
                    ->plainTextToken,

            'user' =>
                $this->userData(
                    $user
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Safe User Data
    |--------------------------------------------------------------------------
    |
    | Password is deliberately NOT included.
    |
    */

    /**
     * @return array<string, mixed>
     */
    private function userData(
        ?User $user
    ): array {
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