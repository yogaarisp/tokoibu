<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierDebt;
use App\Services\DebtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierDebtController extends Controller
{
    public function __construct(private DebtService $debtService) {}

    public function index(Request $request): JsonResponse
    {
        $debts = SupplierDebt::with('supplier:id,name', 'purchase:id,po_number', 'user:id,name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, fn($q, $s) =>
                $q->whereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$s}%"))
            )
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json($debts);
    }

    public function pay(Request $request, SupplierDebt $debt): JsonResponse
    {
        $data = $request->validate([
            'amount'         => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'notes'          => 'nullable|string',
        ]);

        $payment = $this->debtService->paySupplier(
            $debt, $data['amount'], $data['payment_method'], $data['notes'] ?? ''
        );

        return response()->json(['message' => 'Pembayaran berhasil dicatat.', 'payment' => $payment]);
    }
}
