<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', Password::min(8), 'confirmed'],
            'role' => 'required|exists:roles,name',
        ];
    }
}
