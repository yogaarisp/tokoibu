<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\SaleService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class StockMirrorTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $inventoryService;

    private User $user;

    private Location $display;

    private Location $warehouse;

    protected function setUp(): void
    {
        parent::setUp();

        $this->inventoryService = app(InventoryService::class);

        $this->user = User::create([
            'name' => 'Admin Test',
            'email' => 'admin@test.local',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
        Auth::login($this->user);

        $this->display = Location::create(['name' => 'Rak Display', 'type' => 'display']);
        $this->warehouse = Location::create(['name' => 'Gudang', 'type' => 'warehouse']);
    }

    private function makeProduct(int $displayStock = 0, int $warehouseStock = 0): Product
    {
        $category = Category::create(['name' => 'Test '.uniqid()]);

        $product = Product::create([
            'sku' => 'SKU-'.uniqid(),
            'name' => 'Produk Test',
            'category_id' => $category->id,
            'buy_price' => 10000,
            'sell_price' => 15000,
            'stock' => $displayStock + $warehouseStock,
            'min_stock' => 5,
            'unit' => 'pcs',
        ]);

        ProductStock::create([
            'product_id' => $product->id,
            'location_id' => $this->display->id,
            'stock' => $displayStock,
            'min_stock' => 0,
        ]);
        ProductStock::create([
            'product_id' => $product->id,
            'location_id' => $this->warehouse->id,
            'stock' => $warehouseStock,
            'min_stock' => 0,
        ]);

        return $product;
    }

    private function assertMirrorConsistent(Product $product): void
    {
        $total = (int) ProductStock::where('product_id', $product->id)->sum('stock');
        $this->assertSame(
            $total,
            (int) $product->fresh()->stock,
            "Mirror products.stock ({$product->fresh()->stock}) harus = sum(product_stocks) ({$total})"
        );
    }

    public function test_stock_in_keeps_mirror_consistent(): void
    {
        $product = $this->makeProduct();

        $this->inventoryService->stockIn($product->id, 50, 'restock', null, 'manual', $this->warehouse->id);

        $this->assertSame(50, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->warehouse->id)->first()->stock);
        $this->assertMirrorConsistent($product);
    }

    public function test_stock_out_keeps_mirror_consistent(): void
    {
        $product = $this->makeProduct(displayStock: 30);

        $this->inventoryService->stockOut($product->id, 10, 'rusak', $this->display->id);

        $this->assertSame(20, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->display->id)->first()->stock);
        $this->assertMirrorConsistent($product);
    }

    public function test_stock_out_throws_when_location_stock_insufficient(): void
    {
        $product = $this->makeProduct(displayStock: 5);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('tidak mencukupi');

        $this->inventoryService->stockOut($product->id, 10, 'test', $this->display->id);
    }

    public function test_stock_adjust_recomputes_mirror_from_locations(): void
    {
        // Mirror sengaja dibuat salah (harusnya 30+40=70) untuk mensimulasikan drift
        $product = $this->makeProduct(displayStock: 30, warehouseStock: 40);
        Product::where('id', $product->id)->update(['stock' => 999]);

        $this->inventoryService->stockAdjust($product->id, 25, 'opname', $this->display->id);

        $this->assertSame(25, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->display->id)->first()->stock);
        // Mirror diperbaiki dari sum lokasi: 25 + 40 = 65
        $this->assertSame(65, (int) $product->fresh()->stock);
    }

    public function test_stock_transfer_via_api_keeps_mirror_consistent(): void
    {
        // Route dilindungi role:owner|admin — seed role dulu
        (new RolePermissionSeeder)->run();
        $this->user->assignRole('admin');

        $product = $this->makeProduct(displayStock: 50, warehouseStock: 0);

        $this->postJson('/api/v1/stock-transfers', [
            'from_location_id' => $this->display->id,
            'to_location_id' => $this->warehouse->id,
            'product_id' => $product->id,
            'quantity' => 20,
        ])->assertStatus(201);

        $this->assertSame(30, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->display->id)->first()->stock);
        $this->assertSame(20, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->warehouse->id)->first()->stock);
        $this->assertMirrorConsistent($product);
    }

    public function test_sale_via_service_keeps_mirror_consistent(): void
    {
        $product = $this->makeProduct(displayStock: 100);

        $saleService = app(SaleService::class);
        $sale = $saleService->createTransaction([
            'items' => [
                ['product_id' => $product->id, 'quantity' => 7],
            ],
            'payment_method' => 'cash',
        ]);

        $this->assertSame(93, (int) ProductStock::where('product_id', $product->id)
            ->where('location_id', $this->display->id)->first()->stock);
        $this->assertMirrorConsistent($product);

        $saleService->cancel($sale);
        $this->assertMirrorConsistent($product);
    }
}
