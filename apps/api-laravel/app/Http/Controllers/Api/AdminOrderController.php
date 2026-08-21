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
    /*
     * =========================================
     * ADMIN ORDER LIST
     * =========================================
     *
     * Only return 5 orders per page.
     */
    public function index(
        Request $request
    ): JsonResponse {
        /*
         * Summary is for ALL orders,
         * not only the current 5.
         */
        $summary = Order::query()
            ->selectRaw('
                COUNT(*) as total,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as pending,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as confirmed,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as preparing,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as shipped,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as completed,

                SUM(
                    CASE
                        WHEN status = ?
                        THEN 1
                        ELSE 0
                    END
                ) as cancelled
            ', [
                Order::STATUS_PENDING,
                Order::STATUS_CONFIRMED,
                Order::STATUS_PREPARING,
                Order::STATUS_SHIPPED,
                Order::STATUS_COMPLETED,
                Order::STATUS_CANCELLED,
            ])
            ->first();

        /*
         * Only 5 orders for the table.
         */
        $orders = Order::query()
            ->with([
                'items',
                'user:id,name,email',
            ])
            ->latest()
            ->paginate(5)
            ->withQueryString();

        return response()->json([
            /*
             * Keep "orders" as an array
             * so the current React page
             * still works.
             */
            'orders' =>
                $orders->items(),

            /*
             * Summary for all orders.
             */
            'summary' => [
                'total' =>
                    (int) ($summary->total ?? 0),

                'pending' =>
                    (int) ($summary->pending ?? 0),

                'confirmed' =>
                    (int) ($summary->confirmed ?? 0),

                'preparing' =>
                    (int) ($summary->preparing ?? 0),

                'shipped' =>
                    (int) ($summary->shipped ?? 0),

                'completed' =>
                    (int) ($summary->completed ?? 0),

                'cancelled' =>
                    (int) ($summary->cancelled ?? 0),
            ],

            /*
             * Pagination information.
             *
             * We will use this in React
             * for Previous / 1 / 2 / 3 / Next.
             */
            'pagination' => [
                'current_page' =>
                    $orders->currentPage(),

                'last_page' =>
                    $orders->lastPage(),

                'per_page' =>
                    $orders->perPage(),

                'total' =>
                    $orders->total(),

                'from' =>
                    $orders->firstItem(),

                'to' =>
                    $orders->lastItem(),
            ],
        ]);
    }

    /*
     * =========================================
     * CUSTOMER ORDER HISTORY
     * =========================================
     */
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
                'id' =>
                    $user->id,

                'name' =>
                    $user->name,

                'email' =>
                    $user->email,
            ],

            'orders' =>
                $orders,
        ]);
    }

    /*
     * =========================================
     * UPDATE DELIVERY STATUS
     * =========================================
     */
    public function updateStatus(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated =
            $request->validate([
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

            'order' =>
                $order->fresh([
                    'items',
                    'user:id,name,email',
                ]),
        ]);
    }

    /*
     * =========================================
     * UPDATE PAYMENT STATUS
     * =========================================
     */
    public function updatePaymentStatus(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated =
            $request->validate([
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
                $validated[
                    'payment_status'
                ],
        ]);

        return response()->json([
            'message' =>
                'Payment status updated successfully.',

            'order' =>
                $order->fresh([
                    'items',
                    'user:id,name,email',
                ]),
        ]);
    }
}