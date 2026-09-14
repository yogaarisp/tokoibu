<?php

namespace App\Http\Resources;

use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PurchaseItem $resource
 */
class PurchaseItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'purchase_id' => $this->resource->purchase_id,
            'product_id' => $this->resource->product_id,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->resource->product->id,
                'name' => $this->resource->product->name,
                'sku' => $this->resource->product->sku,
            ]),
            'product_name' => $this->resource->product_name,
            'quantity' => $this->resource->quantity,
            'buy_price' => $this->resource->buy_price,
            'subtotal' => $this->resource->subtotal,
        ];
    }
}
