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
     * Show one customer order.
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
     * Create customer order.
     *
     * DEMO CARD:
     *
     * No real payment gateway.
     * No real card validation.
     * No Luhn check.
     * No fixed card number.
     * No expiry validation.
     * No CVV validation.
     *
     * Full card number and CVV
     * are NEVER stored.
     */
    public function store(
        Request $request
    ): JsonResponse {
        $validated =
            $request->validate([
                /*
                 * Customer information.
                 */
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

                /*
                 * Delivery.
                 */
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

                /*
                 * Payment method.
                 */
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

                /*
                 * =================================
                 * DEMO CARD FIELDS
                 * =================================
                 *
                 * No card-format validation.
                 *
                 * Any text can be entered.
                 */
                'card_number' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'cardholder_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'card_expiry' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'card_cvv' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                /*
                 * Order note.
                 */
                'notes' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],

                /*
                 * Products.
                 */
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
         * Prepare safe demo-card metadata.
         */
        $paymentProfile =
            $this->resolvePaymentProfile(
                $request,
                $validated
            );

        /*
         * Everything happens in one
         * database transaction:
         *
         * order
         * order items
         * stock
         * payment
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
                 * =================================
                 * CHECK PRODUCTS + STOCK
                 * =================================
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
                     * Never trust a price
                     * sent by React.
                     *
                     * Price comes from DB.
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
                 * Free shipping for now.
                 */
                $deliveryFee = 0;

                $total =
                    round(
                        $subtotal +
                            $deliveryFee,
                        2
                    );

                /*
                 * Shop currency.
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
                 * =================================
                 * CREATE ORDER
                 * =================================
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
                             * Fake/demo card is treated
                             * as paid immediately.
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
                 * =================================
                 * SAVE GOOGLE MAPS PIN
                 * =================================
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
                 * =================================
                 * ORDER ITEMS + STOCK
                 * =================================
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
                     * Real inventory update.
                     */
                    $product->decrement(
                        'stock',
                        $item[
                            'quantity'
                        ]
                    );
                }

                /*
                 * =================================
                 * PAYMENT RECORD
                 * =================================
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
                         *
                         * No full number.
                         * No CVV.
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
         * Return product image with
         * order success response.
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
     * Build safe payment metadata.
     *
     * IMPORTANT:
     *
     * Full card number and CVV
     * are never returned from here.
     *
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function resolvePaymentProfile(
        Request $request,
        array $validated
    ): array {
        /*
         * =================================
         * CASH ON DELIVERY
         * =================================
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
         * =================================
         * SAVED DEMO CARD
         * =================================
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

            /*
             * If somehow the saved card
             * disappeared, just continue
             * with generic demo metadata.
             *
             * No payment validation.
             */
            if (
                $savedPayment ===
                null
            ) {
                return [
                    'card_brand' =>
                        'Demo Card',

                    'card_last_four' =>
                        'DEMO',

                    'cardholder_name' =>
                        $request
                            ->user()
                            ->name,

                    'expiry_month' =>
                        null,

                    'expiry_year' =>
                        null,
                ];
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
         * =================================
         * NEW DEMO CARD
         * =================================
         *
         * NO CARD VALIDATION.
         */

        $cardNumber =
            trim(
                (string) (
                    $validated[
                        'card_number'
                    ] ?? ''
                )
            );

        $cardholderName =
            trim(
                (string) (
                    $validated[
                        'cardholder_name'
                    ] ?? ''
                )
            );

        $expiry =
            trim(
                (string) (
                    $validated[
                        'card_expiry'
                    ] ?? ''
                )
            );

        /*
         * CVV is intentionally read
         * but NEVER stored.
         *
         * No validation occurs.
         */
        $cvv =
            (string) (
                $validated[
                    'card_cvv'
                ] ?? ''
            );

        /*
         * Immediately discard it.
         */
        unset($cvv);

        /*
         * =================================
         * LAST FOUR ONLY
         * =================================
         *
         * Remove spaces just to make
         * the display cleaner.
         *
         * No card-number validation.
         */
        $cleanCardNumber =
            preg_replace(
                '/\s+/',
                '',
                $cardNumber
            );

        if (
            $cleanCardNumber ===
            ''
        ) {
            $lastFour =
                'DEMO';
        } else {
            /*
             * Last four characters only.
             *
             * Example:
             *
             * hello-card-9999
             * becomes 9999
             */
            $lastFour =
                substr(
                    $cleanCardNumber,
                    -4
                );

            /*
             * Database column has
             * maximum length 4.
             */
            $lastFour =
                str_pad(
                    $lastFour,
                    4,
                    '0',
                    STR_PAD_LEFT
                );
        }

        /*
         * =================================
         * OPTIONAL EXPIRY PARSING
         * =================================
         *
         * We do NOT reject bad expiry.
         *
         * If it looks like MM/YY,
         * save the month/year.
         *
         * Otherwise simply store null.
         */

        $expiryMonth = null;
        $expiryYear = null;

        if (
            preg_match(
                '/^(0?[1-9]|1[0-2])\/(\d{2,4})$/',
                $expiry,
                $matches
            )
        ) {
            $expiryMonth =
                (int) $matches[1];

            $year =
                (int) $matches[2];

            $expiryYear =
                $year < 100
                    ? 2000 + $year
                    : $year;
        }

        /*
         * =================================
         * RETURN SAFE DATA ONLY
         * =================================
         */

        return [
            'card_brand' =>
                'Demo Card',

            'card_last_four' =>
                $lastFour,

            'cardholder_name' =>
                $cardholderName !==
                ''
                    ? $cardholderName
                    : 'Demo Customer',

            'expiry_month' =>
                $expiryMonth,

            'expiry_year' =>
                $expiryYear,
        ];
    }

    /**
     * Generate readable unique
     * TechHub order number.
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