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

    Route::post('/auth/login',  [AuthController::class, 'login']);

    /*
    |----------------------------------------------------------------------
    | PROTECTED ROUTES (Sanctum)
    |----------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me',      [AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Products
        Route::apiResource('products', ProductController::class);
        Route::get('/products/meta/check-identity', [ProductController::class, 'checkIdentity']);
        Route::get('/products/search/barcode', [ProductController::class, 'findByBarcode']);

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Suppliers
        Route::apiResource('suppliers', SupplierController::class);

        // Customers
        Route::apiResource('customers', CustomerController::class);
        Route::get('/customers/{customer}/history', [CustomerController::class, 'history']);

        // Sales
        Route::apiResource('sales', SaleController::class)->only(['index', 'show', 'store']);
        Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);

        // Purchases
        Route::apiResource('purchases', PurchaseController::class)->only(['index', 'show', 'store']);
        Route::post('/purchases/{purchase}/receive', [PurchaseController::class, 'receive']);

        // Inventory
        Route::prefix('inventory')->name('inventory.')->group(function () {
            Route::get('/',        [InventoryController::class, 'index']);
            Route::post('/in',     [InventoryController::class, 'stockIn']);
            Route::post('/out',    [InventoryController::class, 'stockOut']);
            Route::post('/adjust', [InventoryController::class, 'adjust']);
        });

        // Locations
        Route::apiResource('locations', LocationController::class);

        // Stock Transfers
        Route::apiResource('stock-transfers', StockTransferController::class)->only(['index', 'show', 'store']);

        // Customer Debts
        Route::get('/debts/customers',                [CustomerDebtController::class, 'index']);
        Route::post('/debts/customers/{debt}/pay',    [CustomerDebtController::class, 'pay']);

        // Supplier Debts
        Route::get('/debts/suppliers',                [SupplierDebtController::class, 'index']);
        Route::post('/debts/suppliers/{debt}/pay',    [SupplierDebtController::class, 'pay']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/sales',       [ReportController::class, 'sales']);
            Route::get('/inventory',   [ReportController::class, 'inventory']);
            Route::get('/profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('/best-selling',[ReportController::class, 'bestSelling']);
        });

        // Settings
        Route::get('/settings',  [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);

        // Users (owner only)
        Route::apiResource('users', UserController::class)->middleware('role:owner');
    });
});
