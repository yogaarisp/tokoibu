<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property Purchase $purchase
 * @property Product $product
 * @property string $product_name
 * @property int $quantity
 * @property string $buy_price
 * @property string $subtotal
 */
class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'product_id', 'product_name', 'quantity', 'buy_price', 'subtotal'];

    protected $casts = ['buy_price' => 'decimal:2', 'subtotal' => 'decimal:2'];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
