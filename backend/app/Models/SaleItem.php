<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = ['sale_id','product_id','product_name','quantity','buy_price','sell_price','discount','subtotal'];
    protected $casts    = ['buy_price'=>'decimal:2','sell_price'=>'decimal:2','discount'=>'decimal:2','subtotal'=>'decimal:2'];

    public function sale()    { return $this->belongsTo(Sale::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
