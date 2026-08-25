<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedCard;
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
        $payment = SavedCard::query()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($payment === null) {
            return response()->json([
                'saved_card' => null,
            ]);
        }

        return response()->json([
            'saved_card' => [
                'id' => $payment->id,
                'brand' => $payment->card_brand,
                'last_four' => $payment->card_last_four,
                'cardholder_name' => $payment->cardholder_name ?? $request->user()->name,
                'expiry_month' => $payment->expiry_month,
                'expiry_year' => $payment->expiry_year,
            ],
        ]);
    }

    public function storeSavedCard(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'card_number' => ['required', 'string', 'max:255'],
            'cardholder_name' => ['required', 'string', 'max:255'],
            'card_expiry' => ['required', 'string', 'max:20'],
            'card_cvv' => ['required', 'string', 'max:10'],
            'card_type' => ['nullable', 'string', 'max:50'],
        ]);

        $number = preg_replace('/\s+/', '', $validated['card_number']);
        $lastFour = str_pad(substr($number, -4), 4, '0', STR_PAD_LEFT);
        $month = null;
        $year = null;

        if (preg_match('/^(0?[1-9]|1[0-2])\/(\d{2,4})$/', $validated['card_expiry'], $matches)) {
            $month = (int) $matches[1];
            $year = (int) $matches[2];
            $year = $year < 100 ? 2000 + $year : $year;
        }

        $card = SavedCard::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'card_brand' => $validated['card_type'] ?? 'Demo Card',
                'card_last_four' => $lastFour,
                'cardholder_name' => $validated['cardholder_name'],
                'expiry_month' => $month,
                'expiry_year' => $year,
            ],
        );

        return response()->json(['saved_card' => [
            'id' => $card->id,
            'brand' => $card->card_brand,
            'last_four' => $card->card_last_four,
            'cardholder_name' => $card->cardholder_name,
            'expiry_month' => $card->expiry_month,
            'expiry_year' => $card->expiry_year,
        ]], 201);
    }
}
