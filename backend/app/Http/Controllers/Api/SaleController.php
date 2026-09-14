<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelSaleRequest;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService) {}

    public function index(Request $request): JsonResponse
    {
        $sales = Sale::with('customer:id,name', 'user:id,name')
            ->when($request->search, fn ($q, $s) => $q->where('invoice_number', 'like', "%{$s}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->from, fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json(
            $sales->through(fn ($sale) => (new SaleResource($sale))->resolve($request))
        );
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->createTransaction($request->validated());

        return response()->json(new SaleResource($sale->load('items.product', 'customer', 'user')), 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json(
            new SaleResource($sale->load('items.product:id,name,sku', 'customer:id,name,phone', 'user:id,name'))
        );
    }

    public function cancel(CancelSaleRequest $request, Sale $sale): JsonResponse
    {
        $sale = $this->saleService->cancel($sale, $request->reason ?? '');

        return response()->json(['message' => 'Transaksi berhasil dibatalkan.', 'sale' => new SaleResource($sale)]);
    }
}
