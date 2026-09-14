<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property Customer|null $customer
 * @property User $user
 * @property Collection<int, SaleItem> $items
 * @property string $invoice_number
 * @property string $subtotal
 * @property string $discount_amount
 * @property string $tax_amount
 * @property string $grand_total
 * @property string $paid_amount
 * @property string $change_amount
 * @property string $payment_method
 * @property string $status
 */
class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_number', 'customer_id', 'user_id',
        'subtotal', 'discount_amount', 'tax_amount', 'grand_total',
        'paid_amount', 'change_amount', 'payment_method', 'status', 'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            if (! $m->invoice_number) {
                $m->invoice_number = static::nextInvoiceNumber();
            }
        });
    }

    /**
     * Nomor invoice aman dari race condition:
     * pakai tabel counter harian yang di-lock (SELECT ... FOR UPDATE),
     * bukan count() + 1 yang bisa duplikat saat transaksi bersamaan.
     */
    public static function nextInvoiceNumber(): string
    {
        $date = today()->toDateString();

        return (string) DB::transaction(function () use ($date) {
            $seq = DB::table('invoice_sequences')->where('date', $date)->lockForUpdate()->first();

            if (! $seq) {
                try {
                    DB::table('invoice_sequences')->insert([
                        'date' => $date,
                        'last_number' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (UniqueConstraintViolationException) {
                    // Baris dibuat proses lain — lanjut baca ulang dengan lock
                }

                $seq = DB::table('invoice_sequences')->where('date', $date)->lockForUpdate()->first();
            }

            $next = $seq->last_number + 1;

            DB::table('invoice_sequences')->where('date', $date)->update([
                'last_number' => $next,
                'updated_at' => now(),
            ]);

            return 'INV-'.date('Ymd').'-'.str_pad($next, 4, '0', STR_PAD_LEFT);
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<SaleItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function debt(): HasOne
    {
        return $this->hasOne(CustomerDebt::class);
    }
}
