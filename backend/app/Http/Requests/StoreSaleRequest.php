<?php

namespace App\Http\Requests;

class StoreSaleRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.discount' => 'nullable|numeric|min:0|max:100',
            'payment_method' => 'required|in:cash,qris,transfer,debt',
            'paid_amount' => 'nullable|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ];
    }
}
