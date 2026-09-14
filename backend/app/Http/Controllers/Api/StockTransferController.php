<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductStock;
use App\Models\StockTransfer;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index()
    {
        $transfers = StockTransfer::with(['fromLocation', 'toLocation', 'product', 'user'])
            ->orderBy('transferred_at', 'desc')
            ->paginate(20);

        return response()->json($transfers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // Check stock in from location
            $fromStock = ProductStock::where('product_id', $validated['product_id'])
                ->where('location_id', $validated['from_location_id'])
                ->lockForUpdate()
                ->first();

            if (! $fromStock || $fromStock->stock < $validated['quantity']) {
                abort(400, 'Stok di lokasi asal tidak mencukupi');
            }

            // Decrement from location
            $fromStock->decrement('stock', $validated['quantity']);

            // Increment to location
            $toStock = ProductStock::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['to_location_id'],
                ],
                ['stock' => 0, 'min_stock' => 0]
            );
            $toStock->increment('stock', $validated['quantity']);

            // Sinkronkan mirror products.stock dari sum(product_stocks)
            $this->inventoryService->syncStockMirror($validated['product_id']);

            // Create transfer record
            $transfer = StockTransfer::create($validated);
            $transfer->load(['fromLocation', 'toLocation', 'product', 'user']);

            return response()->json($transfer, 201);
        });
    }

    public function show(StockTransfer $stockTransfer)
    {
        $stockTransfer->load(['fromLocation', 'toLocation', 'product', 'user']);

        return response()->json($stockTransfer);
    }
}
