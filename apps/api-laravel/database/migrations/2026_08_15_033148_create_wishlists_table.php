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
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();

            // Customer who saved the product
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Product saved to wishlist
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->timestamps();

            /*
             * Prevent the same customer from
             * saving the same product twice.
             */
            $table->unique([
                'user_id',
                'product_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};