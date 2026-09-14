<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerDebtPayment extends Model
{
    protected $fillable = ['customer_debt_id', 'user_id', 'amount', 'payment_method', 'notes'];

    protected $casts = ['amount' => 'decimal:2'];

    public function debt()
    {
        return $this->belongsTo(CustomerDebt::class, 'customer_debt_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
