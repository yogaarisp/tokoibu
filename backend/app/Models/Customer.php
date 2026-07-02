<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'phone', 'address', 'debt_limit', 'current_debt', 'notes', 'is_active'];
    protected $casts    = [
        'debt_limit'   => 'decimal:2',
        'current_debt' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function scopeActive($q) { return $q->where('is_active', true); }

    public function sales()       { return $this->hasMany(Sale::class); }
    public function debts()       { return $this->hasMany(CustomerDebt::class); }
    public function unpaidDebts() { return $this->hasMany(CustomerDebt::class)->whereIn('status', ['unpaid', 'partial']); }
}
