<?php

namespace App\Http\Resources;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Purchase $resource
 */
class PurchaseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'po_number' => $this->resource->po_number,
            'supplier_id' => $this->resource->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->resource->supplier->id,
                'name' => $this->resource->supplier->name,
            ]),
            'user_id' => $this->resource->user_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->resource->user->id,
                'name' => $this->resource->user->name,
            ]),
            'total_amount' => $this->resource->total_amount,
            'status' => $this->resource->status,
            'order_date' => $this->resource->order_date->toDateString(),
            'received_date' => $this->resource->received_date?->toDateString(),
            'notes' => $this->resource->notes,
            'items' => $this->whenLoaded('items', fn () => PurchaseItemResource::collection($this->resource->items)),
            'debt' => $this->whenLoaded('debt', fn () => $this->resource->debt ? new SupplierDebtResource($this->resource->debt) : null),
            'created_at' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
