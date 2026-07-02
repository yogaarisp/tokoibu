<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerDebt extends Model
{
    use SoftDeletes;

    protected $fillable = ['customer_id','sale_id','user_id','amount','paid_amount','remaining_amount','due_date','status','notes'];
    protected $casts    = ['amount'=>'decimal:2','paid_amount'=>'decimal:2','remaining_amount'=>'decimal:2','due_date'=>'date'];

    public function customer()  { return $this->belongsTo(Customer::class); }
    public function sale()      { return $this->belongsTo(Sale::class); }
    public function user()      { return $this->belongsTo(User::class); }
    public function payments()  { return $this->hasMany(CustomerDebtPayment::class); }
}
