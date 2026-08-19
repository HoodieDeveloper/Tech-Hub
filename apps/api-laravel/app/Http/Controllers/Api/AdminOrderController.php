<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with([
                'items',
                'user:id,name,email',
            ])
            ->latest()
            ->get();

        return response()->json([
            'orders' => $orders,

            'summary' => [
                'total' => $orders->count(),

                'pending' => $orders
                    ->where(
                        'status',
                        Order::STATUS_PENDING
                    )
                    ->count(),

                'confirmed' => $orders
                    ->where(
                        'status',
                        Order::STATUS_CONFIRMED
                    )
                    ->count(),

                'preparing' => $orders
                    ->where(
                        'status',
                        Order::STATUS_PREPARING
                    )
                    ->count(),

                'shipped' => $orders
                    ->where(
                        'status',
                        Order::STATUS_SHIPPED
                    )
                    ->count(),

                'completed' => $orders
                    ->where(
                        'status',
                        Order::STATUS_COMPLETED
                    )
                    ->count(),

                'cancelled' => $orders
                    ->where(
                        'status',
                        Order::STATUS_CANCELLED
                    )
                    ->count(),
            ],
        ]);
    }

    public function customerHistory(
        User $user
    ): JsonResponse {
        $orders = Order::query()
            ->where(
                'user_id',
                $user->id
            )
            ->with('items')
            ->latest()
            ->get();

        return response()->json([
            'customer' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],

            'orders' => $orders,
        ]);
    }

    public function updateStatus(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',

                Rule::in([
                    Order::STATUS_PENDING,
                    Order::STATUS_CONFIRMED,
                    Order::STATUS_PREPARING,
                    Order::STATUS_SHIPPED,
                    Order::STATUS_COMPLETED,
                    Order::STATUS_CANCELLED,
                ]),
            ],
        ]);

        $order->update([
            'status' =>
                $validated['status'],
        ]);

        return response()->json([
            'message' =>
                'Order status updated successfully.',

            'order' => $order->fresh([
                'items',
                'user:id,name,email',
            ]),
        ]);
    }

    public function updatePaymentStatus(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated = $request->validate([
            'payment_status' => [
                'required',

                Rule::in([
                    Order::PAYMENT_UNPAID,
                    Order::PAYMENT_PAID,
                ]),
            ],
        ]);

        $order->update([
            'payment_status' =>
                $validated['payment_status'],
        ]);

        return response()->json([
            'message' =>
                'Payment status updated successfully.',

            'order' => $order->fresh([
                'items',
                'user:id,name,email',
            ]),
        ]);
    }
}