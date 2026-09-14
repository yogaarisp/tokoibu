<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Sinkronkan mirror products.stock dari total product_stocks.
     *
     * products.stock adalah cache/mirror dari sum(product_stocks.stock) â€”
     * dipertahankan sementara untuk backward compatibility (laporan & query lama),
     * sementara product_stocks adalah sumber kebenaran. Panggil ini setelah
     * setiap mutasi product_stocks agar keduanya tidak drift.
     */
    public function syncStockMirror(int $productId): int
    {
        $total = (int) ProductStock::where('product_id', $productId)->sum('stock');

        Product::where('id', $productId)->update(['stock' => $total]);

        return $total;
    }

    public function stockIn(int $productId, int $qty, string $notes = '', ?int $refId = null, string $refType = 'manual', ?int $locationId = null): StockMovement
    {
        return DB::transaction(function () use ($productId, $qty, $notes, $refId, $refType, $locationId) {
            $product = Product::lockForUpdate()->findOrFail($productId);

            // Get default warehouse location if not provided
            if (! $locationId) {
                $location = Location::where('type', 'warehouse')->first();
                if (! $location) {
                    throw new BusinessException('Lokasi gudang tidak ditemukan.');
                }
                $locationId = $location->id;
            }

            // Update or create product stock at location
            $productStock = ProductStock::firstOrCreate(
                ['product_id' => $productId, 'location_id' => $locationId],
                ['stock' => 0, 'min_stock' => 0]
            );
            $productStock->lockForUpdate();
            $before = $productStock->stock;
            $productStock->increment('stock', $qty);

            // Sinkronkan mirror products.stock dari sum(product_stocks)
            $this->syncStockMirror($productId);

            return StockMovement::create([
                'product_id' => $product->id,
                'location_id' => $locationId,
                'user_id' => Auth::id(),
                'type' => 'in',
                'quantity_before' => $before,
                'quantity_change' => $qty,
                'quantity_after' => $before + $qty,
                'reference_type' => $refType,
                'reference_id' => $refId,
                'notes' => $notes,
            ]);
        });
    }

    public function stockOut(int $productId, int $qty, string $notes = '', ?int $locationId = null): StockMovement
    {
        return DB::transaction(function () use ($productId, $qty, $notes, $locationId) {
            $product = Product::lockForUpdate()->findOrFail($productId);

            // Get default display location if not provided
            if (! $locationId) {
                $location = Location::where('type', 'display')->first();
                if (! $location) {
                    throw new BusinessException('Lokasi display tidak ditemukan.');
                }
                $locationId = $location->id;
            }

            // Check stock at location
            $productStock = ProductStock::where('product_id', $productId)
                ->where('location_id', $locationId)
                ->lockForUpdate()
                ->first();

            if (! $productStock || $productStock->stock < $qty) {
                throw new BusinessException("Stok {$product->name} di lokasi tidak mencukupi.");
            }

            // Update product stock at location
            $before = $productStock->stock;
            $productStock->decrement('stock', $qty);

            // Sinkronkan mirror products.stock dari sum(product_stocks)
            $this->syncStockMirror($productId);

            return StockMovement::create([
                'product_id' => $product->id,
                'location_id' => $locationId,
                'user_id' => Auth::id(),
                'type' => 'out',
                'quantity_before' => $before,
                'quantity_change' => -$qty,
                'quantity_after' => $before - $qty,
                'reference_type' => 'manual',
                'reference_id' => null,
                'notes' => $notes,
            ]);
        });
    }

    public function stockAdjust(int $productId, int $newQty, string $notes = '', ?int $locationId = null): StockMovement
    {
        return DB::transaction(function () use ($productId, $newQty, $notes, $locationId) {
            $product = Product::lockForUpdate()->findOrFail($productId);

            // Get default warehouse location if not provided
            if (! $locationId) {
                $location = Location::where('type', 'warehouse')->first();
                if (! $location) {
                    throw new BusinessException('Lokasi gudang tidak ditemukan.');
                }
                $locationId = $location->id;
            }

            // Update or create product stock at location
            $productStock = ProductStock::firstOrCreate(
                ['product_id' => $productId, 'location_id' => $locationId],
                ['stock' => 0, 'min_stock' => 0]
            );
            $productStock->lockForUpdate();
            $before = $productStock->stock;
            $productStock->update(['stock' => $newQty]);

            // Recalculate total product stock (sumber kebenaran: product_stocks)
            $this->syncStockMirror($productId);

            return StockMovement::create([
                'product_id' => $product->id,
                'location_id' => $locationId,
                'user_id' => Auth::id(),
                'type' => 'adjustment',
                'quantity_before' => $before,
                'quantity_change' => $newQty - $before,
                'quantity_after' => $newQty,
                'reference_type' => 'manual',
                'reference_id' => null,
                'notes' => $notes ?: 'Penyesuaian stok',
            ]);
        });
    }
}
