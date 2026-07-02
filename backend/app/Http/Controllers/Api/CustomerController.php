<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::withCount('sales')
            ->when($request->search, fn($q, $s) =>
                $q->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")
            )
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:150',
            'phone'      => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'debt_limit' => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string',
            'is_active'  => 'boolean',
        ]);

        return response()->json(Customer::create($data), 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer->load('unpaidDebts'));
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|required|string|max:150',
            'phone'      => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'debt_limit' => 'nullable|numeric|min:0',
            'notes'      => 'nullable|string',
            'is_active'  => 'boolean',
        ]);

        $customer->update($data);
        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return response()->json(['message' => 'Pelanggan berhasil dihapus.']);
    }

    public function history(Customer $customer): JsonResponse
    {
        $customer->load([
            'sales' => fn($q) => $q->with('items:id,sale_id,product_name,quantity,subtotal')->latest()->limit(20),
            'debts' => fn($q) => $q->with('payments')->latest(),
        ]);

        return response()->json($customer);
    }
}
