<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    /**
     * Fields the admin is allowed to update.
     *
     * @var list<string>
     */
    protected $fillable = [
        'store_name',
        'store_email',
        'store_address',
        'currency',
        'language',
        'timezone',
        'date_format',
        'logo_url',
        'logo_path',
        'new_order_alerts',
        'low_stock_alerts',
        'daily_sales_summary',
    ];

    /**
     * Convert database values to proper PHP types.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'new_order_alerts' => 'boolean',
            'low_stock_alerts' => 'boolean',
            'daily_sales_summary' => 'boolean',
        ];
    }
}