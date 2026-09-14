<?php

namespace App\Http\Requests;

class StoreProductRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'sku' => $this->normalizeSku($this->input('sku')),
            'barcode' => $this->normalizeBarcode($this->input('barcode')),
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:200',
            'sku' => 'nullable|string|max:50|unique:products,sku',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'buy_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:20',
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
