<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
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
            ->when($request->search, fn ($q, $s) => $q->where('po_number', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json(
            $purchases->through(fn ($purchase) => (new PurchaseResource($purchase))->resolve($request))
        );
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->create($request->validated());

        return response()->json(new PurchaseResource($purchase), 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json(
            new PurchaseResource($purchase->load('items.product:id,name,sku', 'supplier:id,name', 'user:id,name', 'debt'))
        );
    }

    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        $request->validate(['received_date' => 'nullable|date']);

        $purchase = $this->purchaseService->receive($purchase, $request->received_date);

        return response()->json(['message' => 'Barang diterima. Stok diperbarui.', 'purchase' => new PurchaseResource($purchase)]);
    }
}
