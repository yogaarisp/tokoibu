<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StockAdjustRequest;
use App\Http\Requests\StockMovementRequest;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with('product:id,name,sku', 'user:id,name')
            ->when($request->product_id, fn ($q, $id) => $q->where('product_id', $id))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->latest()->paginate($request->per_page ?? 30);

        return response()->json($movements);
    }

    public function stockIn(StockMovementRequest $request): JsonResponse
    {
        $data = $request->validated();

        $movement = $this->inventoryService->stockIn(
            $data['product_id'],
            $data['quantity'],
            $data['notes'] ?? 'Stok masuk manual',
            null,
            'manual',
            $data['location_id'] ?? null
        );

        return response()->json(['message' => 'Stok berhasil ditambahkan.', 'movement' => $movement], 201);
    }

    public function stockOut(StockMovementRequest $request): JsonResponse
    {
        $data = $request->validated();

        $movement = $this->inventoryService->stockOut(
            $data['product_id'],
            $data['quantity'],
            $data['notes'] ?? 'Stok keluar manual',
            $data['location_id'] ?? null
        );

        return response()->json(['message' => 'Stok berhasil dikurangi.', 'movement' => $movement], 201);
    }

    public function adjust(StockAdjustRequest $request): JsonResponse
    {
        $data = $request->validated();

        $movement = $this->inventoryService->stockAdjust(
            $data['product_id'],
            $data['new_quantity'],
            $data['notes'] ?? 'Penyesuaian stok',
            $data['location_id'] ?? null
        );

        return response()->json(['message' => 'Stok berhasil disesuaikan.', 'movement' => $movement], 201);
    }
}
