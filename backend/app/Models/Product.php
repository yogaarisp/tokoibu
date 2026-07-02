<?php

namespace App\Models;

use App\Models\Location;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

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
        'buy_price'  => 'decimal:2',
        'sell_price' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    protected $appends = ['photo_url', 'is_low_stock', 'total_stock', 'display_stock'];

    /* ── Scopes ── */
    public function scopeActive($q)          { return $q->where('is_active', true); }
    public function scopeLowStock($q)        { return $q->whereColumn('stock', '<=', 'min_stock'); }
    public function scopeSearch($q, $term)   {
        return $q->where(fn($s) =>
            $s->where('name', 'like', "%{$term}%")
              ->orWhere('sku', 'like', "%{$term}%")
              ->orWhere('barcode', 'like', "%{$term}%")
        );
    }

    /* ── Accessors ── */
    public function getPhotoUrlAttribute(): string
    {
        return $this->photo
            ? '/storage/' . $this->photo
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
        $displayLocation = Location::where('type', 'display')->first();
        if (!$displayLocation) return (int) ($this->stock ?? 0);
        
        $productStock = $this->productStocks()->where('location_id', $displayLocation->id)->first();
        return $productStock ? (int) $productStock->stock : (int) ($this->stock ?? 0);
    }

    /* ── Relations ── */
    public function category()       { return $this->belongsTo(Category::class); }
    public function supplier()       { return $this->belongsTo(Supplier::class); }
    public function stockMovements() { return $this->hasMany(StockMovement::class); }
    public function saleItems()      { return $this->hasMany(SaleItem::class); }
    public function productStocks()  { return $this->hasMany(ProductStock::class); }
}
