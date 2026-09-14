<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property Category $category
 * @property Supplier|null $supplier
 * @property Collection<int, ProductStock> $productStocks
 * @property string $sku
 * @property string $name
 * @property string $buy_price
 * @property string $sell_price
 * @property int $stock
 * @property int $min_stock
 * @property string $unit
 * @property string|null $unit_warehouse
 * @property int|null $unit_conversion
 * @property bool $is_active
 * @property string|null $barcode
 */
class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sku', 'barcode', 'name', 'category_id', 'supplier_id',
        'buy_price', 'sell_price', 'stock', 'min_stock',
        'unit', 'unit_warehouse', 'unit_conversion',
        'photo', 'description', 'is_active',
    ];

    protected $casts = [
        'buy_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected $appends = ['photo_url', 'is_low_stock', 'total_stock', 'display_stock'];

    /* ── Scopes ── */
    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function scopeLowStock($q)
    {
        return $q->whereColumn('stock', '<=', 'min_stock');
    }

    public function scopeSearch($q, $term)
    {
        return $q->where(fn ($s) => $s->where('name', 'like', "%{$term}%")
            ->orWhere('sku', 'like', "%{$term}%")
            ->orWhere('barcode', 'like', "%{$term}%")
        );
    }

    /* ── Accessors ── */
    public function getPhotoUrlAttribute(): string
    {
        return $this->photo
            ? '/storage/'.$this->photo
            : '/images/product-placeholder.svg';
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->display_stock <= $this->min_stock;
    }

    public function getTotalStockAttribute(): int
    {
        return (int) $this->productStocks->sum('stock');
    }

    public function getDisplayStockAttribute(): int
    {
        // Cache ID lokasi display di request-scoped static agar
        // tidak ada query Location per baris produk (N+1)
        static $displayLocationId = null;
        static $resolved = false;

        if (! $resolved) {
            $displayLocationId = Location::where('type', 'display')->value('id');
            $resolved = true;
        }

        if (! $displayLocationId) {
            return (int) ($this->stock ?? 0);
        }

        // Manfaatkan relasi yang sudah di-eager load bila ada (hindari N+1)
        $productStock = $this->productStocks->firstWhere('location_id', $displayLocationId)
            ?? $this->productStocks()->where('location_id', $displayLocationId)->first();

        return $productStock ? (int) $productStock->stock : (int) ($this->stock ?? 0);
    }

    /* ── Relations ── */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /** @return HasMany<ProductStock, $this> */
    public function productStocks(): HasMany
    {
        return $this->hasMany(ProductStock::class);
    }
}
