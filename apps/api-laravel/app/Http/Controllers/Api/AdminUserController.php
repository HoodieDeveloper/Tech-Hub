<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'avatar_url',
                'created_at',
            ])
            ->where('role', User::ROLE_CUSTOMER)
            ->latest()
            ->get();

        return response()->json([
            'users' => $users,

            'summary' => [
                'total' => $users->count(),
                'customers' => $users->count(),
                'admins' => 0,
            ],
        ]);
    }
}