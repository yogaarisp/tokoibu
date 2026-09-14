<?php

namespace App\Http\Resources;

use App\Models\ProductStock;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property ProductStock $resource
 */
class ProductStockResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'product_id' => $this->resource->product_id,
            'location_id' => $this->resource->location_id,
            'location' => $this->whenLoaded('location', fn () => [
                'id' => $this->resource->location->id,
                'name' => $this->resource->location->name,
                'type' => $this->resource->location->type,
            ]),
            'stock' => $this->resource->stock,
            'min_stock' => $this->resource->min_stock,
        ];
    }
}
