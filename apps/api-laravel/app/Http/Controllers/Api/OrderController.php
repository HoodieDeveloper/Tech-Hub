<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Show orders belonging to the logged-in customer.
     */
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->latest()
            ->get();

        return response()->json([
            'orders' => $orders,
        ]);
    }

    /**
     * Show one order belonging to the logged-in customer.
     */
    public function show(
        Request $request,
        Order $order
    ): JsonResponse {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You cannot view this order.');
        }

        $order->load('items');

        return response()->json([
            'order' => $order,
        ]);
    }

    /**
     * Customer places a new order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => [
                'required',
                'string',
                'max:255',
            ],

            'customer_email' => [
                'required',
                'email',
                'max:255',
            ],

            'customer_phone' => [
                'required',
                'string',
                'max:50',
            ],

            'shipping_address' => [
                'required',
                'string',
                'max:2000',
            ],

            'payment_method' => [
                'nullable',
                'string',
                'max:100',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:999',
            ],
        ]);

        $order = DB::transaction(
            function () use (
                $request,
                $validated
            ): Order {
                $subtotal = 0;

                $preparedItems = [];

                /*
                 * Lock every product while checking stock.
                 *
                 * This prevents two customers from buying
                 * the same final item at the same time.
                 */
                foreach ($validated['items'] as $item) {
                    $product = Product::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $item['product_id']
                        );

                    $quantity =
                        (int) $item['quantity'];

                    if ($product->stock < $quantity) {
                        throw ValidationException::withMessages([
                            'items' => [
                                sprintf(
                                    'Not enough stock for %s. Only %d available.',
                                    $product->name,
                                    $product->stock
                                ),
                            ],
                        ]);
                    }

                    /*
                     * Important:
                     * Never trust price sent from React.
                     *
                     * Price always comes from database.
                     */
                    $unitPrice =
                        (float) $product->price;

                    $lineTotal =
                        round(
                            $unitPrice * $quantity,
                            2
                        );

                    $subtotal += $lineTotal;

                    $preparedItems[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ];
                }

                $subtotal =
                    round($subtotal, 2);

                /*
                 * Delivery fee is zero for now.
                 * We can add real delivery rules later.
                 */
                $deliveryFee = 0;

                $total =
                    round(
                        $subtotal + $deliveryFee,
                        2
                    );

                /*
                 * Use the website currency setting.
                 */
                $currency =
                    SiteSetting::query()
                        ->value('currency')
                    ?? 'USD';

                $order = Order::query()->create([
                    'order_number' =>
                        $this->generateOrderNumber(),

                    'user_id' =>
                        $request->user()->id,

                    'customer_name' =>
                        $validated['customer_name'],

                    'customer_email' =>
                        $validated['customer_email'],

                    'customer_phone' =>
                        $validated['customer_phone'],

                    'shipping_address' =>
                        $validated['shipping_address'],

                    'status' =>
                        Order::STATUS_PENDING,

                    'payment_status' =>
                        Order::PAYMENT_UNPAID,

                    'payment_method' =>
                        $validated['payment_method']
                        ?? null,

                    'subtotal' =>
                        $subtotal,

                    'delivery_fee' =>
                        $deliveryFee,

                    'total' =>
                        $total,

                    'currency' =>
                        $currency,

                    'notes' =>
                        $validated['notes']
                        ?? null,
                ]);

                foreach ($preparedItems as $item) {
                    $product =
                        $item['product'];

                    $order->items()->create([
                        'product_id' =>
                            $product->id,

                        'product_name' =>
                            $product->name,

                        'unit_price' =>
                            $item['unit_price'],

                        'quantity' =>
                            $item['quantity'],

                        'line_total' =>
                            $item['line_total'],
                    ]);

                    /*
                     * Reduce product stock after purchase.
                     */
                    $product->decrement(
                        'stock',
                        $item['quantity']
                    );
                }

                return $order;
            }
        );

        $order->load('items');

        return response()->json([
            'message' =>
                'Order placed successfully.',

            'order' => $order,
        ], 201);
    }

    /**
     * Generate a readable unique order number.
     *
     * Example:
     * TH-20260814-A1B2C3
     */
    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = sprintf(
                'TH-%s-%s',
                now()->format('Ymd'),
                strtoupper(
                    Str::random(6)
                )
            );
        } while (
            Order::query()
                ->where(
                    'order_number',
                    $orderNumber
                )
                ->exists()
        );

        return $orderNumber;
    }
}