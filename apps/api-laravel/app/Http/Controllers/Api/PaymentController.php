<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Return the customer's latest reusable DEMO card metadata.
     *
     * This never returns or stores a full card number or CVV.
     */
    public function savedCard(Request $request): JsonResponse
    {
        $payment = Payment::query()
            ->where('user_id', $request->user()->id)
            ->where('method', 'fake_card')
            ->where('status', 'paid')
            ->whereNotNull('card_last_four')
            ->latest('paid_at')
            ->latest('id')
            ->first();

        if ($payment === null) {
            return response()->json([
                'saved_card' => null,
            ]);
        }

        return response()->json([
            'saved_card' => [
                'id' => $payment->id,
                'brand' => $payment->card_brand ?? 'Demo Card',
                'last_four' => $payment->card_last_four,
                'cardholder_name' => $payment->cardholder_name ?? $request->user()->name,
                'expiry_month' => $payment->expiry_month,
                'expiry_year' => $payment->expiry_year,
            ],
        ]);
    }
}
