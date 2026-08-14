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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // Which order this item belongs to
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            // Product that was purchased
            // Nullable so old order history still works
            // even if a product is deleted later.
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            // Save product name at the time of purchase
            $table->string('product_name');

            // Price at the time customer purchased it
            $table->decimal('unit_price', 12, 2);

            // Number of units purchased
            $table->unsignedInteger('quantity');

            // unit_price × quantity
            $table->decimal('line_total', 12, 2);

            $table->timestamps();

            // Useful later for sales analytics
            $table->index('order_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};