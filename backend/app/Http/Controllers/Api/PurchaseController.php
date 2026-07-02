<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(private PurchaseService $purchaseService) {}

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with('supplier:id,name', 'user:id,name')
            ->when($request->search, fn($q, $s) => $q->where('po_number', 'like', "%{$s}%"))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'          => 'required|exists:suppliers,id',
            'order_date'           => 'required|date',
            'notes'                => 'nullable|string',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.buy_price'    => 'required|numeric|min:0',
        ]);

        $purchase = $this->purchaseService->create($data);

        return response()->json($purchase, 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json(
            $purchase->load('items.product:id,name,sku', 'supplier:id,name', 'user:id,name', 'debt')
        );
    }

    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        $request->validate(['received_date' => 'nullable|date']);

        $purchase = $this->purchaseService->receive($purchase, $request->received_date);

        return response()->json(['message' => 'Barang diterima. Stok diperbarui.', 'purchase' => $purchase]);
    }
}
