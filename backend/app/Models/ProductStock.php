<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property Product $product
 * @property Location $location
 * @property int $stock
 * @property int $min_stock
 */
class ProductStock extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'location_id',
        'stock',
        'min_stock',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
