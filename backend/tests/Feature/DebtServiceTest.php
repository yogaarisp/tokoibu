<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\Supplier;
use App\Models\SupplierDebt;
use App\Models\User;
use App\Services\DebtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DebtServiceTest extends TestCase
{
    use RefreshDatabase;

    private DebtService $debtService;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->debtService = app(DebtService::class);

        $this->user = User::create([
            'name' => 'Owner Test',
            'email' => 'owner@test.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
        Auth::login($this->user);
    }

    private function makeCustomerDebt(float $amount = 100000): CustomerDebt
    {
        $customer = Customer::create([
            'name' => 'Bu Sari',
            'debt_limit' => 1000000,
            'current_debt' => $amount,
        ]);

        return CustomerDebt::create([
            'customer_id' => $customer->id,
            'user_id' => $this->user->id,
            'amount' => $amount,
            'paid_amount' => 0,
            'remaining_amount' => $amount,
            'status' => 'unpaid',
        ]);
    }

    public function test_partial_payment_updates_status_and_current_debt(): void
    {
        $debt = $this->makeCustomerDebt(100000);

        $payment = $this->debtService->payCustomer($debt, 40000, 'cash');

        $this->assertEquals(40000, (float) $payment->amount);
        $this->assertEquals(40000, (float) $debt->fresh()->paid_amount);
        $this->assertEquals(60000, (float) $debt->fresh()->remaining_amount);
        $this->assertEquals('partial', $debt->fresh()->status);
        $this->assertEquals(60000, (float) $debt->customer->current_debt);
    }

    public function test_full_payment_marks_debt_paid(): void
    {
        $debt = $this->makeCustomerDebt(100000);

        $this->debtService->payCustomer($debt, 100000, 'cash');

        $this->assertEquals('paid', $debt->fresh()->status);
        $this->assertEquals(0, (float) $debt->fresh()->remaining_amount);
        $this->assertEquals(0, (float) $debt->customer->current_debt);
    }

    public function test_overpayment_throws(): void
    {
        $debt = $this->makeCustomerDebt(100000);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('melebihi sisa hutang');

        $this->debtService->payCustomer($debt, 150000, 'cash');
    }

    public function test_pay_already_paid_debt_throws(): void
    {
        $debt = $this->makeCustomerDebt(100000);
        $this->debtService->payCustomer($debt, 100000, 'cash');

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('sudah lunas');

        $this->debtService->payCustomer($debt->fresh(), 10000, 'cash');
    }

    public function test_supplier_partial_payment(): void
    {
        $supplier = Supplier::create([
            'name' => 'Toko Grosir Jaya',
        ]);

        $debt = SupplierDebt::create([
            'supplier_id' => $supplier->id,
            'user_id' => $this->user->id,
            'amount' => 500000,
            'paid_amount' => 0,
            'remaining_amount' => 500000,
            'status' => 'unpaid',
        ]);

        $this->debtService->paySupplier($debt, 200000, 'transfer');

        $this->assertEquals(200000, (float) $debt->fresh()->paid_amount);
        $this->assertEquals(300000, (float) $debt->fresh()->remaining_amount);
        $this->assertEquals('partial', $debt->fresh()->status);
    }
}
