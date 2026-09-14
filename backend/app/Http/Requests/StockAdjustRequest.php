<?php

namespace App\Http\Requests;

class StockAdjustRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'location_id' => 'nullable|exists:locations,id',
            'new_quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:255',
        ];
    }
}
