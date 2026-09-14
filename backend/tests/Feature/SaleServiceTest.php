<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class SaleServiceTest extends TestCase
{
    use RefreshDatabase;

    private SaleService $saleService;

    private User $user;

    private Location $display;

    private Location $warehouse;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->saleService = app(SaleService::class);

        $this->user = User::create([
            'name' => 'Kasir Test',
            'email' => 'kasir@test.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
        Auth::login($this->user);

        $this->display = Location::create(['name' => 'Rak Display', 'type' => 'display']);
        $this->warehouse = Location::create(['name' => 'Gudang', 'type' => 'warehouse']);

        $category = Category::create(['name' => 'Sembako']);

        $this->product = Product::create([
            'sku' => 'SKU-TEST-001',
            'name' => 'Beras 5kg',
            'category_id' => $category->id,
            'buy_price' => 50000,
            'sell_price' => 65000,
            'stock' => 100,
            'min_stock' => 5,
            'unit' => 'pcs',
        ]);

        ProductStock::create([
            'product_id' => $this->product->id,
            'location_id' => $this->display->id,
            'stock' => 100,
            'min_stock' => 5,
        ]);
        ProductStock::create([
            'product_id' => $this->product->id,
            'location_id' => $this->warehouse->id,
            'stock' => 0,
            'min_stock' => 0,
        ]);
    }

    public function test_create_transaction_reduces_display_stock(): void
    {
        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 2],
            ],
            'payment_method' => 'cash',
        ]);

        $this->assertEquals('paid', $sale->status);
        $this->assertSame(1, (int) $sale->items()->count());
        $this->assertSame(98, $this->product->fresh()->stock);
        $this->assertSame(
            98,
            ProductStock::where('product_id', $this->product->id)
                ->where('location_id', $this->display->id)
                ->first()
                ->stock
        );
    }

    public function test_create_transaction_calculates_totals_with_discount_and_tax(): void
    {
        // 2 x 65000 = 130.000, diskon item 10% → 117.000
        // diskon transaksi 17.000 → 100.000, pajak 10% → 110.000
        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 2, 'discount' => 10],
            ],
            'payment_method' => 'cash',
            'discount_amount' => 17000,
            'tax_rate' => 10,
            'paid_amount' => 200000,
        ]);

        $this->assertEquals(117000, (float) $sale->subtotal);
        $this->assertEquals(110000, (float) $sale->grand_total);
        $this->assertEquals(90000, (float) $sale->change_amount);
    }

    public function test_create_transaction_throws_when_stock_insufficient(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('tidak mencukupi');

        $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 999],
            ],
            'payment_method' => 'cash',
        ]);
    }

    public function test_debt_sale_creates_customer_debt_and_increments_current_debt(): void
    {
        $customer = Customer::create([
            'name' => 'Bu Sari',
            'debt_limit' => 500000,
            'current_debt' => 0,
        ]);

        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'payment_method' => 'debt',
            'customer_id' => $customer->id,
        ]);

        $this->assertEquals('debt', $sale->status);

        $debt = CustomerDebt::where('sale_id', $sale->id)->first();
        $this->assertNotNull($debt);
        $this->assertEquals(65000, (float) $debt->remaining_amount);
        $this->assertEquals('unpaid', $debt->status);
        $this->assertEquals(65000, (float) $customer->fresh()->current_debt);
    }

    public function test_cancel_restores_display_stock(): void
    {
        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 3],
            ],
            'payment_method' => 'cash',
        ]);

        $this->saleService->cancel($sale, 'Salah input');

        $this->assertEquals('cancelled', $sale->fresh()->status);
        $this->assertSame(100, $this->product->fresh()->stock);
        $this->assertSame(
            100,
            ProductStock::where('product_id', $this->product->id)
                ->where('location_id', $this->display->id)
                ->first()
                ->stock
        );
    }

    public function test_cancel_debt_sale_reverses_customer_debt(): void
    {
        $customer = Customer::create([
            'name' => 'Bu Sari',
            'debt_limit' => 500000,
            'current_debt' => 0,
        ]);

        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'payment_method' => 'debt',
            'customer_id' => $customer->id,
        ]);

        $this->assertEquals(65000, (float) $customer->fresh()->current_debt);

        $this->saleService->cancel($sale, 'Transaksi keliru');

        $this->assertEquals('cancelled', $sale->fresh()->status);
        $this->assertEquals(0, (float) $customer->fresh()->current_debt);
        $this->assertEquals('paid', CustomerDebt::where('sale_id', $sale->id)->first()->status);
        $this->assertEquals(0, (float) CustomerDebt::where('sale_id', $sale->id)->first()->remaining_amount);
    }

    public function test_cancel_twice_throws(): void
    {
        $sale = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
        ]);

        $this->saleService->cancel($sale);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('sudah dibatalkan');

        $this->saleService->cancel($sale->fresh());
    }

    public function test_invoice_numbers_are_sequential(): void
    {
        $sale1 = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
        ]);

        $sale2 = $this->saleService->createTransaction([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'payment_method' => 'cash',
        ]);

        $this->assertNotEquals($sale1->invoice_number, $sale2->invoice_number);
        $this->assertMatchesRegularExpression('/^INV-\d{8}-\d{4}$/', $sale1->invoice_number);
        $this->assertMatchesRegularExpression('/^INV-\d{8}-\d{4}$/', $sale2->invoice_number);
    }
}
