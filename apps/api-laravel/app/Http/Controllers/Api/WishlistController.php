<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * Get the logged-in customer's wishlist.
     */
    public function index(Request $request): JsonResponse
    {
        $wishlist = Wishlist::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->with([
                'product.category',
            ])
            ->latest()
            ->get();

        return response()->json([
            'wishlist' => $wishlist,
        ]);
    }

    /**
     * Add a product to the logged-in customer's wishlist.
     */
    public function store(
        Request $request,
        Product $product
    ): JsonResponse {
        if (!$product->is_active) {
            return response()->json([
                'message' =>
                    'This product is not currently available.',
            ], 422);
        }

        /*
         * firstOrCreate prevents duplicate wishlist rows.
         *
         * Even if the customer clicks the heart twice,
         * the same product will only be stored once.
         */
        $wishlist = Wishlist::query()->firstOrCreate([
            'user_id' =>
                $request->user()->id,

            'product_id' =>
                $product->id,
        ]);

        $wishlist->load(
            'product.category'
        );

        return response()->json([
            'message' =>
                'Product added to wishlist.',

            'wishlist_item' =>
                $wishlist,
        ], $wishlist->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Remove a product from the logged-in customer's wishlist.
     */
    public function destroy(
        Request $request,
        Product $product
    ): JsonResponse {
        $deleted = Wishlist::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->where(
                'product_id',
                $product->id
            )
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'message' =>
                    'Product is not in your wishlist.',
            ], 404);
        }

        return response()->json([
            'message' =>
                'Product removed from wishlist.',
        ]);
    }
}