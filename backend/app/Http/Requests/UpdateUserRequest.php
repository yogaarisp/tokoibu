<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $user = $this->route('user');
        $userId = $user instanceof User ? $user->id : $user;

        return [
            'name' => 'required|string|max:150',
            'email' => "required|email|unique:users,email,{$userId}",
            'password' => ['nullable', Password::min(8), 'confirmed'],
            'role' => 'required|exists:roles,name',
        ];
    }
}
