<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Example: TH-20260814-AB12CD
            $table->string('order_number')->unique();

            // Customer who placed the order
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // Customer information at checkout
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone', 50);
            $table->text('shipping_address');

            // Order status
            $table->string('status')
                ->default('pending');

            // Payment
            $table->string('payment_status')
                ->default('unpaid');

            $table->string('payment_method')
                ->nullable();

            // Money
            $table->decimal('subtotal', 12, 2)
                ->default(0);

            $table->decimal('delivery_fee', 12, 2)
                ->default(0);

            $table->decimal('total', 12, 2)
                ->default(0);

            $table->string('currency', 10)
                ->default('USD');

            // Optional customer note
            $table->text('notes')
                ->nullable();

            $table->timestamps();

            // Helpful later for Admin analytics
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};