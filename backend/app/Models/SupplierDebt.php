<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property Supplier $supplier
 * @property Purchase $purchase
 * @property User $user
 * @property string $status
 * @property string $amount
 * @property string $paid_amount
 * @property string $remaining_amount
 */
class SupplierDebt extends Model
{
    use SoftDeletes;

    protected $fillable = ['supplier_id', 'purchase_id', 'user_id', 'amount', 'paid_amount', 'remaining_amount', 'due_date', 'status', 'notes'];

    protected $casts = ['amount' => 'decimal:2', 'paid_amount' => 'decimal:2', 'remaining_amount' => 'decimal:2', 'due_date' => 'date'];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierDebtPayment::class);
    }
}
