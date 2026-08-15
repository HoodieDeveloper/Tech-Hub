<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /*
     * Get logged-in customer's cart.
     */
    public function index(Request $request): JsonResponse
    {
        $cartItems = CartItem::query()
            ->where('user_id', $request->user()->id)
            ->with(['product.category'])
            ->latest()
            ->get();

        return response()->json([
            'cart_items' => $cartItems,
        ]);
    }

    /*
     * Add product to cart.
     */
 public function store(
    Request $request,
    Product $product
): JsonResponse {
    $validated = $request->validate([
        'quantity' => [
            'sometimes',
            'integer',
            'min:1',
        ],
    ]);

    $quantityToAdd =
        $validated['quantity'] ?? 1;

    if (!$product->is_active) {
        return response()->json([
            'message' => 'This product is not currently available.',
        ], 422);
    }

    if ($product->stock <= 0) {
        return response()->json([
            'message' => 'This product is out of stock.',
        ], 422);
    }

    if ($quantityToAdd > $product->stock) {
        return response()->json([
            'message' => 'Requested quantity exceeds available stock.',
        ], 422);
    }

    $cartItem = CartItem::query()
        ->where(
            'user_id',
            $request->user()->id,
        )
        ->where(
            'product_id',
            $product->id,
        )
        ->first();

    /*
     * Product already exists:
     * add selected quantity
     * to existing quantity.
     */
    if ($cartItem) {
        $newQuantity =
            $cartItem->quantity +
            $quantityToAdd;

        if (
            $newQuantity >
            $product->stock
        ) {
            return response()->json([
                'message' => 'Cart quantity cannot exceed available stock.',
            ], 422);
        }

        $cartItem->update([
            'quantity' =>
                $newQuantity,
        ]);
    } else {
        /*
         * New cart item.
         */
        $cartItem =
            CartItem::create([
                'user_id' =>
                    $request->user()->id,

                'product_id' =>
                    $product->id,

                'quantity' =>
                    $quantityToAdd,
            ]);
    }

    $cartItem->load(
        'product.category',
    );

    return response()->json([
        'message' =>
            'Product added to cart.',

        'cart_item' =>
            $cartItem,
    ], 200);
}

    /*
     * Change product quantity.
     */
    public function update(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $cartItem = CartItem::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->first();

        if (!$cartItem) {
            return response()->json([
                'message' => 'Product is not in your cart.',
            ], 404);
        }

        if ($validated['quantity'] > $product->stock) {
            return response()->json([
                'message' => 'Cart quantity cannot exceed available stock.',
            ], 422);
        }

        $cartItem->update([
            'quantity' => $validated['quantity'],
        ]);

        $cartItem->load('product.category');

        return response()->json([
            'message' => 'Cart updated.',
            'cart_item' => $cartItem,
        ]);
    }

    /*
     * Remove product from cart.
     */
    public function destroy(
        Request $request,
        Product $product
    ): JsonResponse {
        $deleted = CartItem::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'message' => 'Product is not in your cart.',
            ], 404);
        }

        return response()->json([
            'message' => 'Product removed from cart.',
        ]);
    }

    /*
 * Clear all items from
 * logged-in customer's cart.
 */
public function clear(Request $request): JsonResponse
{
    CartItem::query()
        ->where('user_id', $request->user()->id)
        ->delete();

    return response()->json([
        'message' => 'Cart cleared.',
    ]);
}
}