<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wishlist extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
    ];

    /**
     * Customer who owns this wishlist item.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Product saved in the wishlist.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}