<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        /*
         * Product statistics
         */
        $products = Product::query()->count();

        $activeProducts = Product::query()
            ->where('is_active', true)
            ->count();

        $outOfStockProducts = Product::query()
            ->where('stock', '<=', 0)
            ->count();

        /*
         * User statistics
         */
        $customers = User::query()
            ->where(
                'role',
                User::ROLE_CUSTOMER
            )
            ->count();

        $admins = User::query()
            ->where(
                'role',
                User::ROLE_ADMIN
            )
            ->count();

        /*
         * Order statistics
         */
        $totalOrders = Order::query()
            ->count();

        $pendingOrders = Order::query()
            ->where(
                'status',
                Order::STATUS_PENDING
            )
            ->count();

        $completedOrders = Order::query()
            ->where(
                'status',
                Order::STATUS_COMPLETED
            )
            ->count();

        $cancelledOrders = Order::query()
            ->where(
                'status',
                Order::STATUS_CANCELLED
            )
            ->count();

        /*
         * Total value of all non-cancelled orders.
         *
         * Your first pending order will already
         * appear here so you can test analytics.
         */
        $totalSales = Order::query()
            ->where(
                'status',
                '!=',
                Order::STATUS_CANCELLED
            )
            ->sum('total');

        /*
         * Orders created today.
         */
        $todayOrders = Order::query()
            ->whereDate(
                'created_at',
                today()
            )
            ->count();

        /*
         * Sales value created today.
         */
        $todaySales = Order::query()
            ->whereDate(
                'created_at',
                today()
            )
            ->where(
                'status',
                '!=',
                Order::STATUS_CANCELLED
            )
            ->sum('total');

        /*
         * Number of individual units sold.
         *
         * Example:
         * Laptop x2 + Mouse x3
         * = 5 units sold.
         */
        $itemsSold = OrderItem::query()
            ->whereHas(
                'order',
                function ($query): void {
                    $query->where(
                        'status',
                        '!=',
                        Order::STATUS_CANCELLED
                    );
                }
            )
            ->sum('quantity');

        /*
         * Best-selling products.
         *
         * Group order_items by product name
         * and calculate quantity + sales value.
         */
        $bestSellingProducts = OrderItem::query()
            ->selectRaw(
                '
                product_id,
                product_name,
                SUM(quantity) as quantity_sold,
                SUM(line_total) as sales_total
                '
            )
            ->whereHas(
                'order',
                function ($query): void {
                    $query->where(
                        'status',
                        '!=',
                        Order::STATUS_CANCELLED
                    );
                }
            )
            ->groupBy(
                'product_id',
                'product_name'
            )
            ->orderByDesc('quantity_sold')
            ->limit(5)
            ->get()
            ->map(
                function (OrderItem $item): array {
                    return [
                        'product_id' =>
                            $item->product_id,

                        'product_name' =>
                            $item->product_name,

                        'quantity_sold' =>
                            (int) $item->quantity_sold,

                        'sales_total' =>
                            number_format(
                                (float) $item->sales_total,
                                2,
                                '.',
                                ''
                            ),
                    ];
                }
            );

        return response()->json([
            /*
             * Existing dashboard data
             */
            'products' =>
                $products,

            'active_products' =>
                $activeProducts,

            'out_of_stock_products' =>
                $outOfStockProducts,

            'customers' =>
                $customers,

            'admins' =>
                $admins,

            /*
             * New order analytics
             */
            'total_orders' =>
                $totalOrders,

            'pending_orders' =>
                $pendingOrders,

            'completed_orders' =>
                $completedOrders,

            'cancelled_orders' =>
                $cancelledOrders,

            'total_sales' =>
                number_format(
                    (float) $totalSales,
                    2,
                    '.',
                    ''
                ),

            'today_orders' =>
                $todayOrders,

            'today_sales' =>
                number_format(
                    (float) $todaySales,
                    2,
                    '.',
                    ''
                ),

            'items_sold' =>
                (int) $itemsSold,

            'best_selling_products' =>
                $bestSellingProducts,
        ]);
    }
}