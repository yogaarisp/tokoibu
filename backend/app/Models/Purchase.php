<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property Supplier $supplier
 * @property User $user
 * @property Collection<int, PurchaseItem> $items
 * @property SupplierDebt|null $debt
 * @property string $po_number
 * @property string $total_amount
 * @property string $status
 * @property Carbon $order_date
 * @property Carbon|null $received_date
 */
class Purchase extends Model
{
    use SoftDeletes;

    protected $fillable = ['po_number', 'supplier_id', 'user_id', 'total_amount', 'status', 'order_date', 'received_date', 'notes'];

    protected $casts = ['total_amount' => 'decimal:2', 'order_date' => 'date', 'received_date' => 'date'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            if (! $m->po_number) {
                $count = Purchase::whereDate('created_at', today())->count() + 1;
                $m->po_number = 'PO-'.date('Ymd').'-'.str_pad($count, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<PurchaseItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function debt(): HasOne
    {
        return $this->hasOne(SupplierDebt::class);
    }
}
