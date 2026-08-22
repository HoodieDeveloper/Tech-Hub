<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class AdminReportController extends Controller
{
    /**
     * Query all non-cancelled purchases for one day or one month.
     *
     * The response includes:
     * - summary totals
     * - all purchased orders/items in the period
     * - product quantities/revenue
     * - each product's CURRENT shop stock
     * - chart trend data
     */
    public function sales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode' => [
                'required',
                Rule::in(['daily', 'monthly']),
            ],
            'date' => [
                'nullable',
                'date_format:Y-m-d',
            ],
            'month' => [
                'nullable',
                'date_format:Y-m',
            ],
        ]);

        $mode = (string) $validated['mode'];

        if ($mode === 'daily') {
            $date = Carbon::createFromFormat(
                'Y-m-d',
                (string) ($validated['date'] ?? now()->format('Y-m-d'))
            );

            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();
            $label = $date->format('F j, Y');
        } else {
            $month = Carbon::createFromFormat(
                'Y-m',
                (string) ($validated['month'] ?? now()->format('Y-m'))
            );

            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $label = $month->format('F Y');
        }

        $orders = Order::query()
            ->whereBetween('created_at', [
                $start,
                $end,
            ])
            ->where(
                'status',
                '!=',
                Order::STATUS_CANCELLED
            )
            ->with([
                'items.product:id,stock',
            ])
            ->latest('created_at')
            ->get();

        $products = $this->buildProductRows(
            $orders
        );

        $revenue = round(
            (float) $orders->sum(
                fn (Order $order) => (float) $order->total
            ),
            2
        );

        $itemsSold = (int) $products->sum('quantity');

        $orderCount = $orders->count();

        $averageOrder = $orderCount > 0
            ? round($revenue / $orderCount, 2)
            : 0.0;

        return response()->json([
            'period' => [
                'mode' => $mode,
                'label' => $label,
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
            ],

            'summary' => [
                'revenue' => $revenue,
                'orders' => $orderCount,
                'items_sold' => $itemsSold,
                'average_order' => $averageOrder,
            ],

            'products' => $products->values(),

            'orders' => $orders,

            'trend' => $this->buildTrend(
                $orders,
                $mode,
                $start,
                $end
            ),
        ]);
    }

    /**
     * @param Collection<int, Order> $orders
     * @return Collection<int, array<string, mixed>>
     */
    private function buildProductRows(Collection $orders): Collection
    {
        $rows = [];

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $key = $item->product_id !== null
                    ? 'id:' . $item->product_id
                    : 'name:' . $item->product_name;

                if (!isset($rows[$key])) {
                    $rows[$key] = [
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'quantity' => 0,
                        'revenue' => 0.0,
                        'current_stock' => $item->product?->stock,
                    ];
                }

                $rows[$key]['quantity'] += (int) $item->quantity;
                $rows[$key]['revenue'] = round(
                    $rows[$key]['revenue'] + (float) $item->line_total,
                    2
                );

                if ($item->product !== null) {
                    $rows[$key]['current_stock'] = (int) $item->product->stock;
                }
            }
        }

        return collect(array_values($rows))
            ->sortByDesc('quantity')
            ->values();
    }

    /**
     * @param Collection<int, Order> $orders
     * @return array<int, array<string, mixed>>
     */
    private function buildTrend(
        Collection $orders,
        string $mode,
        Carbon $start,
        Carbon $end
    ): array {
        if ($mode === 'daily') {
            $points = [];

            for ($hour = 0; $hour < 24; $hour++) {
                $hourOrders = $orders->filter(
                    fn (Order $order) =>
                        Carbon::parse($order->created_at)->hour === $hour
                );

                $points[] = [
                    'key' => sprintf('%02d:00', $hour),
                    'label' => sprintf('%02d', $hour),
                    'revenue' => round(
                        (float) $hourOrders->sum(
                            fn (Order $order) => (float) $order->total
                        ),
                        2
                    ),
                    'orders' => $hourOrders->count(),
                ];
            }

            return $points;
        }

        $points = [];
        $cursor = $start->copy()->startOfDay();
        $lastDay = $end->copy()->startOfDay();

        while ($cursor->lte($lastDay)) {
            $dayKey = $cursor->format('Y-m-d');

            $dayOrders = $orders->filter(
                fn (Order $order) =>
                    Carbon::parse($order->created_at)->format('Y-m-d') === $dayKey
            );

            $points[] = [
                'key' => $dayKey,
                'label' => $cursor->format('j'),
                'revenue' => round(
                    (float) $dayOrders->sum(
                        fn (Order $order) => (float) $order->total
                    ),
                    2
                ),
                'orders' => $dayOrders->count(),
            ];

            $cursor->addDay();
        }

        return $points;
    }
}
