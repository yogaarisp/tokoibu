<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use SoftDeletes;

    protected $fillable = ['po_number','supplier_id','user_id','total_amount','status','order_date','received_date','notes'];
    protected $casts    = ['total_amount'=>'decimal:2','order_date'=>'date','received_date'=>'date'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($m) {
            if (! $m->po_number) {
                $count = Purchase::whereDate('created_at', today())->count() + 1;
                $m->po_number = 'PO-' . date('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function items()    { return $this->hasMany(PurchaseItem::class); }
    public function debt()     { return $this->hasOne(SupplierDebt::class); }
}
