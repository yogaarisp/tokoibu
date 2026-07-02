<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Location::create([
            'name' => 'Gudang',
            'type' => 'warehouse',
            'description' => 'Lokasi penyimpanan utama',
            'is_active' => true,
        ]);

        Location::create([
            'name' => 'Rak Display',
            'type' => 'display',
            'description' => 'Lokasi produk yang dijual',
            'is_active' => true,
        ]);
    }
}
