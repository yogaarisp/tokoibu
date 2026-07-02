<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_number', 'customer_id', 'user_id',
        'subtotal', 'discount_amount', 'tax_amount', 'grand_total',
        'paid_amount', 'change_amount', 'payment_method', 'status', 'notes',
    ];

    protected $casts = [
        'subtotal'        => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount'      => 'decimal:2',
        'grand_total'     => 'decimal:2',
        'paid_amount'     => 'decimal:2',
        'change_amount'   => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            if (! $m->invoice_number) {
                $count = Sale::whereDate('created_at', today())->count() + 1;
                $m->invoice_number = 'INV-' . date('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function customer() { return $this->belongsTo(Customer::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function items()    { return $this->hasMany(SaleItem::class); }
    public function debt()     { return $this->hasOne(CustomerDebt::class); }
}
