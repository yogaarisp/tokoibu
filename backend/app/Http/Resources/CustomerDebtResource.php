<?php

namespace App\Http\Resources;

use App\Models\CustomerDebt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property CustomerDebt $resource
 */
class CustomerDebtResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'customer_id' => $this->resource->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->resource->customer->id,
                'name' => $this->resource->customer->name,
                'phone' => $this->resource->customer->phone,
            ]),
            'sale_id' => $this->resource->sale_id,
            'sale' => $this->whenLoaded('sale', fn () => $this->resource->sale ? [
                'id' => $this->resource->sale->id,
                'invoice_number' => $this->resource->sale->invoice_number,
            ] : null),
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
