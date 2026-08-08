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
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();

            // Store information
            $table->string('store_name')->default('TechHub');
            $table->string('store_email')->nullable();
            $table->text('store_address')->nullable();

            // Regional settings
            $table->string('currency', 10)->default('USD');
            $table->string('language', 50)->default('English');
            $table->string('timezone', 100)->default('Asia/Phnom_Penh');
            $table->string('date_format', 30)->default('M d, Y');

            // Store logo in Supabase Storage
            $table->text('logo_url')->nullable();
            $table->text('logo_path')->nullable();

            // Notification preferences
            $table->boolean('new_order_alerts')->default(true);
            $table->boolean('low_stock_alerts')->default(true);
            $table->boolean('daily_sales_summary')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};