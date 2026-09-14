<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class ApiFormRequest extends FormRequest
{
    /**
     * Selalu return JSON (API), bukan redirect back.
     * Format error konsisten dengan handler ValidationException di bootstrap/app.php.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Data tidak valid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
