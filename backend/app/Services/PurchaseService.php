<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Location;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(private InventoryService $inventoryService) {}

    public function create(array $data): Purchase
    {
        return DB::transaction(function () use ($data) {
            $total = collect($data['items'])->sum(fn($i) => $i['buy_price'] * $i['quantity']);

            $purchase = Purchase::create([
                'supplier_id'  => $data['supplier_id'],
                'user_id'      => Auth::id(),
                'total_amount' => $total,
                'status'       => 'pending',
                'order_date'   => $data['order_date'] ?? now()->toDateString(),
                'notes'        => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id'  => $purchase->id,
                    'product_id'   => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity'     => $item['quantity'],
                    'buy_price'    => $item['buy_price'],
                    'subtotal'     => $item['buy_price'] * $item['quantity'],
                ]);
            }

            return $purchase->load('items.product', 'supplier');
        });
    }

    public function receive(Purchase $purchase, ?string $receivedDate = null): Purchase
    {
        return DB::transaction(function () use ($purchase, $receivedDate) {
            if ($purchase->status !== 'pending') {
                throw new \Exception('PO sudah diproses atau dibatalkan.');
            }

            $purchase->update([
                'status'        => 'received',
                'received_date' => $receivedDate ?? now()->toDateString(),
            ]);

            // Get warehouse location
            $warehouse = Location::where('type', 'warehouse')->first();
            if (!$warehouse) {
                throw new \Exception("Lokasi gudang tidak ditemukan.");
            }

            foreach ($purchase->items as $item) {
                $this->inventoryService->stockIn(
                    $item->product_id, $item->quantity,
                    "Penerimaan PO: {$purchase->po_number}",
                    $purchase->id, 'purchase',
                    $warehouse->id
                );
                $item->product->update(['buy_price' => $item->buy_price]);
            }

            return $purchase->fresh();
        });
    }
}
