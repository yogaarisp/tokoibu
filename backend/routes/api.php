<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerDebtController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StockTransferController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierDebtController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->group(function () {

    // Rate limit: cegah brute force login (5 percobaan / menit)
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    /*
    |----------------------------------------------------------------------
    | PROTECTED ROUTES (Sanctum)
    |----------------------------------------------------------------------
    | Matrix role (lihat README):
    |   - owner|admin  : dashboard, kategori, supplier, pembelian, inventori, hutang
    |   - owner|kasir  : transaksi POS
    |   - owner        : batalkan penjualan, pengaturan, pengguna
    |   - semua role   : produk, pelanggan, penjualan (lihat), laporan
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->middleware('role:owner|admin');

        // Products (semua role)
        Route::apiResource('products', ProductController::class);
        Route::get('/products/meta/check-identity', [ProductController::class, 'checkIdentity']);
        Route::get('/products/search/barcode', [ProductController::class, 'findByBarcode']);

        // Categories (owner & admin)
        Route::apiResource('categories', CategoryController::class)
            ->middleware('role:owner|admin');

        // Suppliers (owner & admin)
        Route::apiResource('suppliers', SupplierController::class)
            ->middleware('role:owner|admin');

        // Customers (semua role)
        Route::apiResource('customers', CustomerController::class);
        Route::get('/customers/{customer}/history', [CustomerController::class, 'history']);

        // Sales — lihat: semua | buat (POS): owner & kasir | batal: owner & admin
        Route::get('/sales', [SaleController::class, 'index']);
        Route::get('/sales/{sale}', [SaleController::class, 'show']);
        Route::post('/sales', [SaleController::class, 'store'])
            ->middleware('role:owner|kasir');
        Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel'])
            ->middleware('role:owner|admin');

        // Purchases (owner & admin)
        Route::apiResource('purchases', PurchaseController::class)
            ->only(['index', 'show', 'store'])
            ->middleware('role:owner|admin');
        Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive'])
            ->middleware('role:owner|admin');

        // Inventory (owner & admin)
        Route::prefix('inventory')->name('inventory.')->middleware('role:owner|admin')->group(function () {
            Route::get('/', [InventoryController::class, 'index']);
            Route::post('/in', [InventoryController::class, 'stockIn']);
            Route::post('/out', [InventoryController::class, 'stockOut']);
            Route::post('/adjust', [InventoryController::class, 'adjust']);
        });

        // Locations (owner & admin)
        Route::apiResource('locations', LocationController::class)
            ->middleware('role:owner|admin');

        // Stock Transfers (owner & admin)
        Route::apiResource('stock-transfers', StockTransferController::class)
            ->only(['index', 'show', 'store'])
            ->middleware('role:owner|admin');

        // Customer Debts (owner & admin)
        Route::get('/debts/customers', [CustomerDebtController::class, 'index'])
            ->middleware('role:owner|admin');
        Route::post('/debts/customers/{debt}/pay', [CustomerDebtController::class, 'pay'])
            ->middleware('role:owner|admin');

        // Supplier Debts (owner & admin)
        Route::get('/debts/suppliers', [SupplierDebtController::class, 'index'])
            ->middleware('role:owner|admin');
        Route::post('/debts/suppliers/{debt}/pay', [SupplierDebtController::class, 'pay'])
            ->middleware('role:owner|admin');

        // Reports (semua role)
        Route::prefix('reports')->group(function () {
            Route::get('/sales', [ReportController::class, 'sales']);
            Route::get('/inventory', [ReportController::class, 'inventory']);
            Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('/best-selling', [ReportController::class, 'bestSelling']);
        });

        // Settings — baca: semua (kasir butuh data toko utk struk) | ubah: owner
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update'])
            ->middleware('role:owner');

        // Users (owner only)
        Route::apiResource('users', UserController::class)->middleware('role:owner');
    });
});
