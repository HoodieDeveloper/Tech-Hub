<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'You must log in before using this endpoint.',
            ], 401);
        }

        if (! $user->isAdmin()) {
            return response()->json([
                'message' => 'Administrator access is required.',
            ], 403);
        }

        return $next($request);
    }
}
