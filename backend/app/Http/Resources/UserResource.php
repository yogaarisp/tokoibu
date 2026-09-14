<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Permission\Models\Role;

/**
 * @property User $resource
 */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'is_active' => $this->resource->is_active,
            'roles' => $this->whenLoaded('roles', fn () => $this->resource->roles->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
            ])),
            'created_at' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
