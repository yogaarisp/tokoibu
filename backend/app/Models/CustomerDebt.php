<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property Customer $customer
 * @property Sale|null $sale
 * @property User $user
 * @property Collection<int, CustomerDebtPayment> $payments
 * @property string $status
 * @property string $amount
 * @property string $paid_amount
 * @property string $remaining_amount
 */
class CustomerDebt extends Model
{
    use SoftDeletes;

    protected $fillable = ['customer_id', 'sale_id', 'user_id', 'amount', 'paid_amount', 'remaining_amount', 'due_date', 'status', 'notes'];

    protected $casts = ['amount' => 'decimal:2', 'paid_amount' => 'decimal:2', 'remaining_amount' => 'decimal:2', 'due_date' => 'date'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CustomerDebtPayment::class);
    }
}
