<?php

namespace App\Http\Requests;

class PayDebtRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string',
        ];
    }
}
