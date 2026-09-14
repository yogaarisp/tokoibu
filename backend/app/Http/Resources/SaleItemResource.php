<?php

namespace App\Http\Resources;

use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property SaleItem $resource
 */
class SaleItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'sale_id' => $this->resource->sale_id,
            'product_id' => $this->resource->product_id,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->resource->product->id,
                'name' => $this->resource->product->name,
                'sku' => $this->resource->product->sku,
            ]),
            'product_name' => $this->resource->product_name,
            'quantity' => $this->resource->quantity,
            'buy_price' => $this->resource->buy_price,
            'sell_price' => $this->resource->sell_price,
            'discount' => $this->resource->discount,
            'subtotal' => $this->resource->subtotal,
        ];
    }
}
