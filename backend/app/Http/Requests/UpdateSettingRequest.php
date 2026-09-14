<?php

namespace App\Http\Requests;

class UpdateSettingRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'store_name' => 'required|string|max:150',
            'store_address' => 'nullable|string|max:255',
            'store_phone' => 'nullable|string|max:30',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|string|max:10',
            'receipt_note' => 'nullable|string|max:255',
        ];
    }
}
