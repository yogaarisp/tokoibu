<?php

namespace App\Http\Resources;

use App\Models\SupplierDebt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property SupplierDebt $resource
 */
class SupplierDebtResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'supplier_id' => $this->resource->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->resource->supplier->id,
                'name' => $this->resource->supplier->name,
            ]),
            'purchase_id' => $this->resource->purchase_id,
            'user_id' => $this->resource->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->resource->user->id,
                'name' => $this->resource->user->name,
            ]),
            'amount' => $this->resource->amount,
            'paid_amount' => $this->resource->paid_amount,
            'remaining_amount' => $this->resource->remaining_amount,
            'due_date' => $this->resource->due_date?->toDateString(),
            'status' => $this->resource->status,
            'notes' => $this->resource->notes,
            'created_at' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
