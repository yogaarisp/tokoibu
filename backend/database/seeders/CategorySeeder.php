<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $list = [
            ['name' => 'Sembako',     'icon' => 'ShoppingBasket'],
            ['name' => 'Makanan',     'icon' => 'UtensilsCrossed'],
            ['name' => 'Minuman',     'icon' => 'Coffee'],
            ['name' => 'Rokok',       'icon' => 'Cigarette'],
            ['name' => 'LPG',         'icon' => 'Flame'],
            ['name' => 'Frozen Food', 'icon' => 'Snowflake'],
            ['name' => 'Household',   'icon' => 'Home'],
            ['name' => 'Perawatan',   'icon' => 'Sparkles'],
            ['name' => 'Snack',       'icon' => 'Cookie'],
        ];

        foreach ($list as $cat) {
            Category::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                array_merge($cat, ['slug' => Str::slug($cat['name'])])
            );
        }
    }
}
