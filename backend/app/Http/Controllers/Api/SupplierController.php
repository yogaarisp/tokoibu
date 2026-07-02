<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::withCount('products')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:150',
            'phone'     => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:150',
            'address'   => 'nullable|string',
            'notes'     => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        return response()->json(Supplier::create($data), 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load('products:id,name,stock,unit', 'debts'));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'sometimes|required|string|max:150',
            'phone'     => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:150',
            'address'   => 'nullable|string',
            'notes'     => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($data);

        return response()->json($supplier->fresh());
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier berhasil dihapus.']);
    }
}
