<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Show orders belonging to the logged-in customer.
     */
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->with(
                'items.product:id,image_url'
            )
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
        if (
            $order->user_id !==
            $request->user()->id
        ) {
            abort(
                403,
                'You cannot view this order.'
            );
        }

        $order->load(
            'items.product:id,image_url'
        );

        return response()->json([
            'order' => $order,
        ]);
    }

    /**
     * Customer places a new order.
     *
     * DEMO PAYMENT ONLY:
     *
     * - Accepts any 4-19 digit demo card number.
     * - Does NOT connect to a real bank.
     * - Full card number is NEVER stored.
     * - CVV is NEVER stored.
     * - Only the last 4 digits are saved.
     * - Returning customers can reuse
     *   their latest saved demo card.
     */
    public function store(
        Request $request
    ): JsonResponse {
        $validated =
            $request->validate([
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

                'shipping_latitude' => [
                    'nullable',
                    'numeric',
                    'between:-90,90',
                ],

                'shipping_longitude' => [
                    'nullable',
                    'numeric',
                    'between:-180,180',
                ],

                'payment_method' => [
                    'required',

                    Rule::in([
                        'fake_card',
                        'cash_on_delivery',
                    ]),
                ],

                'use_saved_card' => [
                    'sometimes',
                    'boolean',
                ],

                'card_number' => [
                    'nullable',
                    'string',
                    'max:32',
                ],

                'cardholder_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'card_expiry' => [
                    'nullable',
                    'string',
                    'max:5',
                ],

                'card_cvv' => [
                    'nullable',
                    'string',
                    'max:4',
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

        /*
         * Resolve safe demo-card metadata.
         */
        $paymentProfile =
            $this->resolvePaymentProfile(
                $request,
                $validated
            );

        /*
         * Order + payment + stock update
         * happen in one database transaction.
         */
        $order = DB::transaction(
            function () use (
                $request,
                $validated,
                $paymentProfile
            ): Order {
                $subtotal = 0;

                $preparedItems = [];

                /*
                 * Check every product and lock
                 * its row while the order is created.
                 */
                foreach (
                    $validated['items']
                    as $item
                ) {
                    $product =
                        Product::query()
                            ->lockForUpdate()
                            ->findOrFail(
                                $item[
                                    'product_id'
                                ]
                            );

                    $quantity =
                        (int) $item[
                            'quantity'
                        ];

                    /*
                     * Prevent ordering more than
                     * current stock.
                     */
                    if (
                        $product->stock <
                        $quantity
                    ) {
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
                     * Always use price from
                     * the database.
                     */
                    $unitPrice =
                        (float) $product->price;

                    $lineTotal =
                        round(
                            $unitPrice *
                                $quantity,
                            2
                        );

                    $subtotal +=
                        $lineTotal;

                    $preparedItems[] = [
                        'product' =>
                            $product,

                        'quantity' =>
                            $quantity,

                        'unit_price' =>
                            $unitPrice,

                        'line_total' =>
                            $lineTotal,
                    ];
                }

                $subtotal =
                    round(
                        $subtotal,
                        2
                    );

                /*
                 * Delivery is free for now.
                 */
                $deliveryFee = 0;

                $total =
                    round(
                        $subtotal +
                            $deliveryFee,
                        2
                    );

                /*
                 * Get shop currency.
                 */
                $currency =
                    SiteSetting::query()
                        ->value(
                            'currency'
                        )
                    ?? 'USD';

                $isFakeCard =
                    $validated[
                        'payment_method'
                    ] === 'fake_card';

                /*
                 * Create the order.
                 */
                $order =
                    Order::query()
                        ->create([
                            'order_number' =>
                                $this
                                    ->generateOrderNumber(),

                            'user_id' =>
                                $request
                                    ->user()
                                    ->id,

                            'customer_name' =>
                                $validated[
                                    'customer_name'
                                ],

                            'customer_email' =>
                                $validated[
                                    'customer_email'
                                ],

                            'customer_phone' =>
                                $validated[
                                    'customer_phone'
                                ],

                            'shipping_address' =>
                                $validated[
                                    'shipping_address'
                                ],

                            'status' =>
                                Order::STATUS_PENDING,

                            /*
                             * Demo card acts like
                             * successful payment.
                             */
                            'payment_status' =>
                                $isFakeCard
                                    ? Order::PAYMENT_PAID
                                    : Order::PAYMENT_UNPAID,

                            'payment_method' =>
                                $validated[
                                    'payment_method'
                                ],

                            'subtotal' =>
                                $subtotal,

                            'delivery_fee' =>
                                $deliveryFee,

                            'total' =>
                                $total,

                            'currency' =>
                                $currency,

                            'notes' =>
                                $validated[
                                    'notes'
                                ] ?? null,
                        ]);

                /*
                 * Save map coordinates.
                 *
                 * Direct assignment avoids requiring
                 * changes to Order::$fillable.
                 */
                $order->shipping_latitude =
                    $validated[
                        'shipping_latitude'
                    ] ?? null;

                $order->shipping_longitude =
                    $validated[
                        'shipping_longitude'
                    ] ?? null;

                $order->save();

                /*
                 * Create order items and
                 * decrease real shop stock.
                 */
                foreach (
                    $preparedItems
                    as $item
                ) {
                    /** @var Product $product */
                    $product =
                        $item[
                            'product'
                        ];

                    $order
                        ->items()
                        ->create([
                            'product_id' =>
                                $product->id,

                            'product_name' =>
                                $product->name,

                            'unit_price' =>
                                $item[
                                    'unit_price'
                                ],

                            'quantity' =>
                                $item[
                                    'quantity'
                                ],

                            'line_total' =>
                                $item[
                                    'line_total'
                                ],
                        ]);

                    /*
                     * Update inventory.
                     */
                    $product->decrement(
                        'stock',
                        $item[
                            'quantity'
                        ]
                    );
                }

                /*
                 * Create one payment row
                 * for every order.
                 */
                Payment::query()
                    ->create([
                        'order_id' =>
                            $order->id,

                        'user_id' =>
                            $request
                                ->user()
                                ->id,

                        'method' =>
                            $validated[
                                'payment_method'
                            ],

                        'provider' =>
                            $isFakeCard
                                ? 'techhub_demo'
                                : 'cash_on_delivery',

                        'transaction_ref' =>
                            $isFakeCard
                                ? 'DEMO-' .
                                    strtoupper(
                                        Str::random(
                                            14
                                        )
                                    )
                                : 'COD-' .
                                    strtoupper(
                                        Str::random(
                                            14
                                        )
                                    ),

                        'amount' =>
                            $total,

                        'currency' =>
                            $currency,

                        'status' =>
                            $isFakeCard
                                ? 'paid'
                                : 'pending',

                        /*
                         * Safe metadata only.
                         */
                        'card_brand' =>
                            $paymentProfile[
                                'card_brand'
                            ],

                        'card_last_four' =>
                            $paymentProfile[
                                'card_last_four'
                            ],

                        'cardholder_name' =>
                            $paymentProfile[
                                'cardholder_name'
                            ],

                        'expiry_month' =>
                            $paymentProfile[
                                'expiry_month'
                            ],

                        'expiry_year' =>
                            $paymentProfile[
                                'expiry_year'
                            ],

                        'paid_at' =>
                            $isFakeCard
                                ? now()
                                : null,
                    ]);

                return $order;
            }
        );

        /*
         * Return product images too.
         */
        $order->load(
            'items.product:id,image_url'
        );

        return response()->json([
            'message' =>
                'Order placed successfully.',

            'order' =>
                $order,
        ], 201);
    }

    /**
     * Resolve demo card metadata.
     *
     * Full number and CVV are NOT returned
     * from this method and are NOT saved.
     *
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function resolvePaymentProfile(
        Request $request,
        array $validated
    ): array {
        /*
         * Cash on delivery has
         * no card information.
         */
        if (
            $validated[
                'payment_method'
            ] !== 'fake_card'
        ) {
            return [
                'card_brand' =>
                    null,

                'card_last_four' =>
                    null,

                'cardholder_name' =>
                    null,

                'expiry_month' =>
                    null,

                'expiry_year' =>
                    null,
            ];
        }

        /*
         * =========================================
         * SAVED DEMO CARD
         * =========================================
         */

        $useSavedCard =
            (bool) (
                $validated[
                    'use_saved_card'
                ] ?? false
            );

        if (
            $useSavedCard
        ) {
            $savedPayment =
                Payment::query()
                    ->where(
                        'user_id',
                        $request
                            ->user()
                            ->id
                    )
                    ->where(
                        'method',
                        'fake_card'
                    )
                    ->where(
                        'status',
                        'paid'
                    )
                    ->whereNotNull(
                        'card_last_four'
                    )
                    ->latest(
                        'paid_at'
                    )
                    ->latest(
                        'id'
                    )
                    ->first();

            if (
                $savedPayment ===
                null
            ) {
                throw ValidationException::withMessages([
                    'payment_method' => [
                        'No saved demo card was found. Please enter a demo card first.',
                    ],
                ]);
            }

            return [
                'card_brand' =>
                    $savedPayment
                        ->card_brand
                    ?? 'Demo Card',

                'card_last_four' =>
                    $savedPayment
                        ->card_last_four,

                'cardholder_name' =>
                    $savedPayment
                        ->cardholder_name,

                'expiry_month' =>
                    $savedPayment
                        ->expiry_month,

                'expiry_year' =>
                    $savedPayment
                        ->expiry_year,
            ];
        }

        /*
         * =========================================
         * NEW DEMO CARD
         * =========================================
         */

        /*
         * Remove spaces, dashes, letters,
         * and everything except digits.
         *
         * Example:
         * 1234 5678 9999 1111
         *
         * becomes:
         * 1234567899991111
         */
        $cardNumber =
            preg_replace(
                '/\D+/',
                '',
                (string) (
                    $validated[
                        'card_number'
                    ] ?? ''
                )
            );

        /*
         * Demo system:
         *
         * Accept any 4-19 digit number.
         *
         * We DO NOT check against a bank.
         */
        if (
            strlen(
                $cardNumber
            ) < 4 ||
            strlen(
                $cardNumber
            ) > 19
        ) {
            throw ValidationException::withMessages([
                'card_number' => [
                    'Please enter a demo card number between 4 and 19 digits.',
                ],
            ]);
        }

        /*
         * Cardholder name.
         */
        $cardholderName =
            trim(
                (string) (
                    $validated[
                        'cardholder_name'
                    ] ?? ''
                )
            );

        if (
            mb_strlen(
                $cardholderName
            ) < 2
        ) {
            throw ValidationException::withMessages([
                'cardholder_name' => [
                    'Please enter the demo cardholder name.',
                ],
            ]);
        }

        /*
         * Expiry must still be MM/YY.
         *
         * Examples:
         *
         * 12/34
         * 08/30
         * 01/29
         */
        $expiry =
            (string) (
                $validated[
                    'card_expiry'
                ] ?? ''
            );

        if (
            !preg_match(
                '/^(0[1-9]|1[0-2])\/(\d{2})$/',
                $expiry,
                $matches
            )
        ) {
            throw ValidationException::withMessages([
                'card_expiry' => [
                    'Demo expiry must use MM/YY format.',
                ],
            ]);
        }

        /*
         * For now we still use demo CVV 123.
         *
         * It is checked here but NEVER saved.
         */
        $cvv =
            (string) (
                $validated[
                    'card_cvv'
                ] ?? ''
            );

        if (
            $cvv !== '123'
        ) {
            throw ValidationException::withMessages([
                'card_cvv' => [
                    'Use the demo CVV 123.',
                ],
            ]);
        }

        /*
         * IMPORTANT:
         *
         * We only return the LAST FOUR
         * digits of the demo card.
         *
         * Full number is discarded.
         */
        return [
            'card_brand' =>
                'Demo Card',

            'card_last_four' =>
                substr(
                    $cardNumber,
                    -4
                ),

            'cardholder_name' =>
                $cardholderName,

            'expiry_month' =>
                (int) $matches[1],

            'expiry_year' =>
                2000 +
                (int) $matches[2],
        ];
    }

    /**
     * Generate readable unique
     * order number.
     *
     * Example:
     *
     * TH-20260823-A1B2C3
     */
    private function generateOrderNumber(): string
    {
        do {
            $orderNumber =
                sprintf(
                    'TH-%s-%s',
                    now()->format(
                        'Ymd'
                    ),
                    strtoupper(
                        Str::random(
                            6
                        )
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