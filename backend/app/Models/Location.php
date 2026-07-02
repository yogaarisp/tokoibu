<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'description',
        'is_active',
    ];

    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }
}
