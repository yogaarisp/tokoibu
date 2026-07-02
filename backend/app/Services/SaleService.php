<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Location;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function createTransaction(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $subtotal      = 0;
            $itemsToCreate = [];

            // Get display location
            $displayLocation = Location::where('type', 'display')->first();
            if (!$displayLocation) {
                throw new \Exception("Lokasi display tidak ditemukan.");
            }

            foreach ($data['items'] as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                // Check stock at display location
                $productStock = ProductStock::where('product_id', $product->id)
                    ->where('location_id', $displayLocation->id)
                    ->lockForUpdate()
                    ->first();

                $availableStock = $productStock ? $productStock->stock : $product->stock;

                if ($availableStock < $item['quantity']) {
                    throw new \Exception("Stok {$product->name} di rak display tidak mencukupi. Sisa: {$availableStock}");
                }

                $discount  = $item['discount'] ?? 0;
                $lineTotal = $product->sell_price * $item['quantity'];
                $lineNet   = $lineTotal - ($lineTotal * $discount / 100);
                $subtotal += $lineNet;

                $itemsToCreate[] = compact('product', 'discount', 'lineNet', 'productStock') + ['quantity' => $item['quantity']];
            }

            $discountAmt  = $data['discount_amount'] ?? 0;
            $taxRate      = $data['tax_rate'] ?? 0;
            $afterDiscount = $subtotal - $discountAmt;
            $taxAmount    = $afterDiscount * ($taxRate / 100);
            $grandTotal   = $afterDiscount + $taxAmount;
            $isDebt       = $data['payment_method'] === 'debt';
            $paidAmount   = $isDebt ? 0 : ($data['paid_amount'] ?? $grandTotal);
            $changeAmount = $isDebt ? 0 : max(0, $paidAmount - $grandTotal);

            $sale = Sale::create([
                'customer_id'    => $data['customer_id'] ?? null,
                'user_id'        => Auth::id(),
                'subtotal'       => $subtotal,
                'discount_amount'=> $discountAmt,
                'tax_amount'     => $taxAmount,
                'grand_total'    => $grandTotal,
                'paid_amount'    => $paidAmount,
                'change_amount'  => $changeAmount,
                'payment_method' => $data['payment_method'],
                'status'         => $isDebt ? 'debt' : 'paid',
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($itemsToCreate as $item) {
                $product = $item['product'];
                $productStock = $item['productStock'];
                SaleItem::create([
                    'sale_id'      => $sale->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'quantity'     => $item['quantity'],
                    'buy_price'    => $product->buy_price,
                    'sell_price'   => $product->sell_price,
                    'discount'     => $item['discount'],
                    'subtotal'     => $item['lineNet'],
                ]);

                // Update product stock (for backward compatibility)
                $beforeProduct = $product->stock;
                $product->decrement('stock', $item['quantity']);

                // Update product stock at display location
                $before = $productStock ? $productStock->stock : $beforeProduct;
                if ($productStock) {
                    $productStock->decrement('stock', $item['quantity']);
                }

                StockMovement::create([
                    'product_id'      => $product->id,
                    'location_id'     => $displayLocation->id,
                    'user_id'         => Auth::id(),
                    'type'            => 'out',
                    'quantity_before' => $before,
                    'quantity_change' => -$item['quantity'],
                    'quantity_after'  => $before - $item['quantity'],
                    'reference_type'  => 'sale',
                    'reference_id'    => $sale->id,
                    'notes'           => 'Penjualan ' . $sale->invoice_number,
                ]);
            }

            if ($isDebt && $sale->customer_id) {
                CustomerDebt::create([
                    'customer_id'      => $sale->customer_id,
                    'sale_id'          => $sale->id,
                    'user_id'          => Auth::id(),
                    'amount'           => $grandTotal,
                    'paid_amount'      => 0,
                    'remaining_amount' => $grandTotal,
                    'due_date'         => $data['due_date'] ?? null,
                    'status'           => 'unpaid',
                ]);
                Customer::where('id', $sale->customer_id)->increment('current_debt', $grandTotal);
            }

            return $sale->load('items.product', 'customer', 'user');
        });
    }

    public function cancel(Sale $sale, string $reason = ''): Sale
    {
        return DB::transaction(function () use ($sale, $reason) {
            if ($sale->status === 'cancelled') {
                throw new \Exception('Transaksi sudah dibatalkan.');
            }

            $sale->update(['status' => 'cancelled', 'notes' => $reason]);

            // Get display location
            $displayLocation = Location::where('type', 'display')->first();
            if (!$displayLocation) {
                throw new \Exception("Lokasi display tidak ditemukan.");
            }

            foreach ($sale->items as $item) {
                $product = $item->product;
                
                // Update product stock (for backward compatibility)
                $beforeProduct = $product->stock;
                $product->increment('stock', $item['quantity']);

                // Update or create product stock at display location
                $productStock = ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'location_id' => $displayLocation->id],
                    ['stock' => 0, 'min_stock' => 0]
                );
                $productStock->lockForUpdate();
                $before = $productStock->stock;
                $productStock->increment('stock', $item['quantity']);

                StockMovement::create([
                    'product_id'      => $product->id,
                    'location_id'     => $displayLocation->id,
                    'user_id'         => Auth::id(),
                    'type'            => 'in',
                    'quantity_before' => $before,
                    'quantity_change' => $item['quantity'],
                    'quantity_after'  => $before + $item['quantity'],
                    'reference_type'  => 'sale_cancel',
                    'reference_id'    => $sale->id,
                    'notes'           => 'Batal ' . $sale->invoice_number,
                ]);
            }

            return $sale->fresh();
        });
    }
}
