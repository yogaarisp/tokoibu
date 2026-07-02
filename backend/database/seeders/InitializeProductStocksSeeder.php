<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Location;
use App\Models\ProductStock;
use Illuminate\Database\Seeder;

class InitializeProductStocksSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = Location::where('type', 'warehouse')->first();
        $display = Location::where('type', 'display')->first();

        if ($warehouse || $display) {
            Product::chunk(100, function ($products) use ($warehouse, $display) {
                foreach ($products as $product) {
                    if ($warehouse) {
                        ProductStock::firstOrCreate(
                            ['product_id' => $product->id, 'location_id' => $warehouse->id],
                            ['stock' => $product->stock, 'min_stock' => $product->min_stock]
                        );
                    }
                    if ($display) {
                        ProductStock::firstOrCreate(
                            ['product_id' => $product->id, 'location_id' => $display->id],
                            ['stock' => 0, 'min_stock' => $product->min_stock]
                        );
                    }
                }
            });
        }
    }
}