<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Product $resource
 */
class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'sku' => $this->resource->sku,
            'barcode' => $this->resource->barcode,
            'name' => $this->resource->name,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->resource->category->id,
                'name' => $this->resource->category->name,
            ]),
            'supplier' => $this->whenLoaded('supplier', fn () => $this->resource->supplier ? [
                'id' => $this->resource->supplier->id,
                'name' => $this->resource->supplier->name,
            ] : null),
            'buy_price' => $this->resource->buy_price,
            'sell_price' => $this->resource->sell_price,
            'stock' => $this->resource->stock,
            'total_stock' => $this->resource->total_stock,
            'display_stock' => $this->resource->display_stock,
            'is_low_stock' => $this->resource->is_low_stock,
            'min_stock' => $this->resource->min_stock,
            'unit' => $this->resource->unit,
            'unit_warehouse' => $this->resource->unit_warehouse,
            'unit_conversion' => $this->resource->unit_conversion,
            'photo' => $this->resource->photo,
            'photo_url' => $this->resource->photo_url,
            'description' => $this->resource->description,
            'is_active' => $this->resource->is_active,
            'product_stocks' => $this->whenLoaded('productStocks', fn () => ProductStockResource::collection($this->resource->productStocks)),
            'created_at' => $this->resource->created_at?->toIso8601String(),
            'updated_at' => $this->resource->updated_at?->toIso8601String(),
        ];
    }
}
