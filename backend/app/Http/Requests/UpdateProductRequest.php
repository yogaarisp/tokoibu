<?php

namespace App\Http\Requests;

use App\Models\Product;

class UpdateProductRequest extends ApiFormRequest
{
    public function validationData(): array
    {
        $data = parent::validationData();

        // Hanya normalisasi field yang memang dikirim agar nilai null
        // tidak menimpa sku/barcode lama saat update parsial.
        // sku/barcode tidak boleh NULL di database, jadi nilai kosong
        // dibuang (dianggap tidak berubah), bukan disimpan sebagai null.
        if (array_key_exists('sku', $data)) {
            $normalized = $this->normalizeSku($data['sku']);

            if ($normalized === null) {
                unset($data['sku']);
            } else {
                $data['sku'] = $normalized;
            }
        }

        if (array_key_exists('barcode', $data)) {
            $normalized = $this->normalizeBarcode($data['barcode']);

            if ($normalized === null) {
                unset($data['barcode']);
            } else {
                $data['barcode'] = $normalized;
            }
        }

        return $data;
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : $product;

        return [
            'name' => 'sometimes|required|string|max:200',
            'sku' => "sometimes|nullable|string|max:50|unique:products,sku,{$productId}",
            'barcode' => "sometimes|nullable|string|max:100|unique:products,barcode,{$productId}",
            'category_id' => 'sometimes|required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'buy_price' => 'sometimes|required|numeric|min:0',
            'sell_price' => 'sometimes|required|numeric|min:0',
            'min_stock' => 'sometimes|required|integer|min:0',
            'unit' => 'sometimes|required|string|max:20',
            'unit_warehouse' => 'nullable|string|max:20',
            'unit_conversion' => 'nullable|integer|min:1',
            'photo' => 'nullable|image|max:2048',
            'remove_photo' => 'nullable|boolean',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }

    public function normalizeSku(?string $sku): ?string
    {
        $sku = trim((string) $sku);

        return $sku === '' ? null : strtoupper($sku);
    }

    public function normalizeBarcode(?string $barcode): ?string
    {
        $barcode = preg_replace('/\s+/', '', trim((string) $barcode));

        return $barcode === '' ? null : $barcode;
    }
}
