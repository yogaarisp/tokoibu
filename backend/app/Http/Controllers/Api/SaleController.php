<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            ->when($request->search, fn($q, $s) => $q->where('invoice_number', 'like', "%{$s}%"))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->from,   fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,     fn($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.discount'   => 'nullable|numeric|min:0|max:100',
            'payment_method'     => 'required|in:cash,qris,transfer,debt',
            'paid_amount'        => 'nullable|numeric|min:0',
            'customer_id'        => 'nullable|exists:customers,id',
            'discount_amount'    => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'notes'              => 'nullable|string',
        ]);

        $sale = $this->saleService->createTransaction($request->all());

        return response()->json($sale, 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json(
            $sale->load('items.product:id,name,sku', 'customer:id,name,phone', 'user:id,name')
        );
    }

    public function cancel(Request $request, Sale $sale): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:255']);

        $sale = $this->saleService->cancel($sale, $request->reason ?? '');

        return response()->json(['message' => 'Transaksi berhasil dibatalkan.', 'sale' => $sale]);
    }
}
