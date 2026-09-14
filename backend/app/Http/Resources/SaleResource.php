<?php

namespace App\Http\Resources;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Sale $resource
 */
class SaleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'invoice_number' => $this->resource->invoice_number,
            'customer_id' => $this->resource->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => $this->resource->customer ? [
                'id' => $this->resource->customer->id,
                'name' => $this->resource->customer->name,
                'phone' => $this->resource->customer->phone,
            ] : null),
            'user_id' => $this->resource->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->resource->user->id,
                'name' => $this->resource->user->name,
            ]),
            'subtotal' => $this->resource->subtotal,
            'discount_amount' => $this->resource->discount_amount,
            'tax_amount' => $this->resource->tax_amount,
            'grand_total' => $this->resource->grand_total,
            'paid_amount' => $this->resource->paid_amount,
            'change_amount' => $this->resource->change_amount,
            'payment_method' => $this->resource->payment_method,
            'status' => $this->resource->status,
            'notes' => $this->resource->notes,
            'items' => $this->whenLoaded('items', fn () => SaleItemResource::collection($this->resource->items)),
            'created_at' => $this->resource->created_at?->toIso8601String(),
            'updated_at' => $this->resource->updated_at?->toIso8601String(),
        ];
    }
}
