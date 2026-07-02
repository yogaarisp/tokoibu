<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class StockTransfer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'transfer_number',
        'from_location_id',
        'to_location_id',
        'product_id',
        'quantity',
        'notes',
        'user_id',
        'transferred_at',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = 'TRF-' . date('YmdHis') . '-' . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
            }

            if (empty($transfer->user_id) && Auth::check()) {
                $transfer->user_id = Auth::id();
            }
        });
    }

    public function fromLocation()
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
