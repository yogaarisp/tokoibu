<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\CustomerDebtPayment;
use App\Models\SupplierDebt;
use App\Models\SupplierDebtPayment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DebtService
{
    public function payCustomer(CustomerDebt $debt, float $amount, string $method, string $notes = ''): CustomerDebtPayment
    {
        return DB::transaction(function () use ($debt, $amount, $method, $notes) {
            // Re-lock row di dalam transaction untuk cegah double-submit
            $debt = CustomerDebt::whereKey($debt->id)->lockForUpdate()->firstOrFail();

            if ($debt->status === 'paid') {
                throw new BusinessException('Hutang sudah lunas.');
            }
            if ($amount > (float) $debt->remaining_amount) {
                throw new BusinessException('Jumlah melebihi sisa hutang.');
            }

            $payment = CustomerDebtPayment::create([
                'customer_debt_id' => $debt->id,
                'user_id' => Auth::id(),
                'amount' => $amount,
                'payment_method' => $method,
                'notes' => $notes,
            ]);

            $newPaid = (float) $debt->paid_amount + $amount;
            $newRemaining = max(0, (float) $debt->amount - $newPaid);

            $debt->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $newRemaining <= 0 ? 'paid' : 'partial',
            ]);

            Customer::where('id', $debt->customer_id)->decrement('current_debt', $amount);

            return $payment;
        });
    }

    public function paySupplier(SupplierDebt $debt, float $amount, string $method, string $notes = ''): SupplierDebtPayment
    {
        return DB::transaction(function () use ($debt, $amount, $method, $notes) {
            // Re-lock row di dalam transaction untuk cegah double-submit
            $debt = SupplierDebt::whereKey($debt->id)->lockForUpdate()->firstOrFail();

            if ($debt->status === 'paid') {
                throw new BusinessException('Hutang sudah lunas.');
            }
            if ($amount > (float) $debt->remaining_amount) {
                throw new BusinessException('Jumlah melebihi sisa hutang.');
            }

            $payment = SupplierDebtPayment::create([
                'supplier_debt_id' => $debt->id,
                'user_id' => Auth::id(),
                'amount' => $amount,
                'payment_method' => $method,
                'notes' => $notes,
            ]);

            $newPaid = (float) $debt->paid_amount + $amount;
            $newRemaining = max(0, (float) $debt->amount - $newPaid);

            $debt->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $newRemaining <= 0 ? 'paid' : 'partial',
            ]);

            return $payment;
        });
    }
}
