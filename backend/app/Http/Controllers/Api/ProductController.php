<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function normalizeSku(?string $sku): ?string
    {
        $sku = trim((string) $sku);

        return $sku === '' ? null : strtoupper($sku);
    }

    private function normalizeBarcode(?string $barcode): ?string
    {
        $barcode = preg_replace('/\s+/', '', trim((string) $barcode));

        return $barcode === '' ? null : $barcode;
    }

    public function index(Request $request): JsonResponse
    {
        $products = Product::with('category:id,name', 'supplier:id,name', 'productStocks.location')
            ->when($request->search, fn ($q, $s) => $q->search($s))
            ->when($request->category_id, fn ($q, $c) => $q->where('category_id', $c))
            ->when($request->low_stock, fn ($q) => $q->lowStock())
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        unset($data['remove_photo']);

        if (empty($data['sku'])) {
            $data['sku'] = 'SKU-'.strtoupper(Str::random(8));
        }

        if (empty($data['unit_warehouse'])) {
            $data['unit_warehouse'] = $data['unit'];
        }

        if (empty($data['unit_conversion'])) {
            $data['unit_conversion'] = 1;
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('products', 'public');
        }

        $product = Product::create($data);

        // Inisialisasi stok di gudang dan rak
        $warehouse = Location::where('type', 'warehouse')->first();
        $display = Location::where('type', 'display')->first();

        if ($warehouse) {
            ProductStock::firstOrCreate(
                ['product_id' => $product->id, 'location_id' => $warehouse->id],
                ['stock' => 0, 'min_stock' => $data['min_stock']]
            );
        }

        if ($display) {
            ProductStock::firstOrCreate(
                ['product_id' => $product->id, 'location_id' => $display->id],
                ['stock' => 0, 'min_stock' => $data['min_stock']]
            );
        }

        return response()->json($product->load('category:id,name', 'supplier:id,name', 'productStocks'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(
            $product->load('category:id,name', 'supplier:id,name', 'productStocks.location', 'stockMovements.user:id,name')
        );
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        $removePhoto = $request->boolean('remove_photo');

        if ($request->hasFile('photo')) {
            if ($product->photo) {
                Storage::disk('public')->delete($product->photo);
            }
            $data['photo'] = $request->file('photo')->store('products', 'public');
        } elseif ($removePhoto && $product->photo) {
            Storage::disk('public')->delete($product->photo);
            $data['photo'] = null;
        }

        unset($data['remove_photo']);

        $product->update($data);

        return response()->json($product->fresh()->load('category:id,name', 'supplier:id,name', 'productStocks'));
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->photo) {
            Storage::disk('public')->delete($product->photo);
        }
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }

    public function checkIdentity(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'sku' => 'nullable|string|max:50',
            'barcode' => 'nullable|string|max:100',
            'ignore_id' => 'nullable|integer',
        ]);

        $ignoreId = $payload['ignore_id'] ?? null;
        $sku = $this->normalizeSku($payload['sku'] ?? null);
        $barcode = $this->normalizeBarcode($payload['barcode'] ?? null);

        $skuProduct = $sku
            ? Product::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('sku', $sku)
                ->first()
            : null;

        $barcodeProduct = $barcode
            ? Product::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('barcode', $barcode)
                ->first()
            : null;

        return response()->json([
            'sku' => [
                'value' => $sku,
                'exists' => (bool) $skuProduct,
                'product' => $skuProduct ? [
                    'id' => $skuProduct->id,
                    'name' => $skuProduct->name,
                    'sku' => $skuProduct->sku,
                ] : null,
            ],
            'barcode' => [
                'value' => $barcode,
                'exists' => (bool) $barcodeProduct,
                'product' => $barcodeProduct ? [
                    'id' => $barcodeProduct->id,
                    'name' => $barcodeProduct->name,
                    'barcode' => $barcodeProduct->barcode,
                ] : null,
            ],
        ]);
    }

    public function findByBarcode(Request $request): JsonResponse
    {
        $request->merge([
            'barcode' => $this->normalizeBarcode($request->input('barcode')),
        ]);

        $request->validate(['barcode' => 'required|string']);

        $product = Product::active()
            ->where('barcode', $request->barcode)
            ->with('category:id,name')
            ->firstOrFail();

        return response()->json($product);
    }
}
