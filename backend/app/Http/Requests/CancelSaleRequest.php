<?php

namespace App\Http\Requests;

class CancelSaleRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|max:255',
        ];
    }
}
