<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property Sale $sale
 * @property Product $product
 * @property string $product_name
 * @property int $quantity
 * @property string $buy_price
 * @property string $sell_price
 * @property string $subtotal
 */
class SaleItem extends Model
{
    protected $fillable = ['sale_id', 'product_id', 'product_name', 'quantity', 'buy_price', 'sell_price', 'discount', 'subtotal'];

    protected $casts = ['buy_price' => 'decimal:2', 'sell_price' => 'decimal:2', 'discount' => 'decimal:2', 'subtotal' => 'decimal:2'];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
