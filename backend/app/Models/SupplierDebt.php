<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierDebt extends Model
{
    use SoftDeletes;

    protected $fillable = ['supplier_id','purchase_id','user_id','amount','paid_amount','remaining_amount','due_date','status','notes'];
    protected $casts    = ['amount'=>'decimal:2','paid_amount'=>'decimal:2','remaining_amount'=>'decimal:2','due_date'=>'date'];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function purchase() { return $this->belongsTo(Purchase::class); }
    public function user()     { return $this->belongsTo(User::class); }
    public function payments() { return $this->hasMany(SupplierDebtPayment::class); }
}
