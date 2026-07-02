<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerDebt;
use App\Services\DebtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerDebtController extends Controller
{
    public function __construct(private DebtService $debtService) {}

    public function index(Request $request): JsonResponse
    {
        $debts = CustomerDebt::with('customer:id,name,phone', 'sale:id,invoice_number', 'user:id,name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->search, fn($q, $s) =>
                $q->whereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$s}%"))
            )
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json($debts);
    }

    public function pay(Request $request, CustomerDebt $debt): JsonResponse
    {
        $data = $request->validate([
            'amount'         => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'notes'          => 'nullable|string',
        ]);

        $payment = $this->debtService->payCustomer(
            $debt, $data['amount'], $data['payment_method'], $data['notes'] ?? ''
        );

        return response()->json(['message' => 'Pembayaran berhasil dicatat.', 'payment' => $payment]);
    }
}
