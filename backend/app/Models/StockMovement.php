<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = ['product_id','location_id','user_id','type','quantity_before','quantity_change','quantity_after','reference_type','reference_id','notes'];

    public function product() { return $this->belongsTo(Product::class); }
    public function location() { return $this->belongsTo(Location::class); }
    public function user()    { return $this->belongsTo(User::class); }
}
