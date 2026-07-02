<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan ada supplier default
        $supplier = Supplier::firstOrCreate(
            ['name' => 'Indofood Sukses Makmur'],
            [
                'phone'     => '021-7592-7676',
                'email'     => 'order@indofood.co.id',
                'address'   => 'Jl. Jend. Sudirman Kav. 76-78, Jakarta',
                'is_active' => true,
            ]
        );

        $supplierRokok = Supplier::firstOrCreate(
            ['name' => 'Gudang Garam'],
            [
                'phone'     => '0354-682091',
                'address'   => 'Jl. Semampir II / 1, Kediri, Jawa Timur',
                'is_active' => true,
            ]
        );

        $supplierUmum = Supplier::firstOrCreate(
            ['name' => 'Distributor Lokal'],
            [
                'phone'     => '08123000001',
                'address'   => 'Jl. Pasar Baru No. 1, Jakarta',
                'is_active' => true,
            ]
        );

        // Ambil kategori by slug
        $catSembako   = Category::where('slug', 'sembako')->first();
        $catMakanan   = Category::where('slug', 'makanan')->first();
        $catMinuman   = Category::where('slug', 'minuman')->first();
        $catRokok     = Category::where('slug', 'rokok')->first();
        $catHousehold = Category::where('slug', 'household')->first();

        $products = [
            /* ── SEMBAKO (3 produk) ── */
            [
                'sku'         => 'SKU-BERAS-001',
                'barcode'     => '8993560310010',
                'name'        => 'Beras Rojolele 5 Kg',
                'category_id' => $catSembako?->id ?? 1,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 62000,
                'sell_price'  => 68000,
                'stock'       => 50,
                'min_stock'   => 10,
                'unit'        => 'karung',
            ],
            [
                'sku'         => 'SKU-GULA-001',
                'barcode'     => '8993560310011',
                'name'        => 'Gula Pasir Gulaku 1 Kg',
                'category_id' => $catSembako?->id ?? 1,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 14500,
                'sell_price'  => 16000,
                'stock'       => 80,
                'min_stock'   => 15,
                'unit'        => 'bungkus',
            ],
            [
                'sku'         => 'SKU-MINYAK-001',
                'barcode'     => '8999999800013',
                'name'        => 'Minyak Goreng Bimoli 2 Liter',
                'category_id' => $catSembako?->id ?? 1,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 32000,
                'sell_price'  => 35000,
                'stock'       => 40,
                'min_stock'   => 8,
                'unit'        => 'botol',
            ],

            /* ── MAKANAN (3 produk) ── */
            [
                'sku'         => 'SKU-INDOMIE-001',
                'barcode'     => '8999999800014',
                'name'        => 'Indomie Goreng Original',
                'category_id' => $catMakanan?->id ?? 2,
                'supplier_id' => $supplier->id,
                'buy_price'   => 2500,
                'sell_price'  => 3500,
                'stock'       => 200,
                'min_stock'   => 30,
                'unit'        => 'pcs',
            ],
            [
                'sku'         => 'SKU-SARIMI-001',
                'barcode'     => '8999999800015',
                'name'        => 'Sarimi Ayam Bawang',
                'category_id' => $catMakanan?->id ?? 2,
                'supplier_id' => $supplier->id,
                'buy_price'   => 1800,
                'sell_price'  => 2500,
                'stock'       => 150,
                'min_stock'   => 25,
                'unit'        => 'pcs',
            ],
            [
                'sku'         => 'SKU-BISCUIT-001',
                'barcode'     => '8999999800016',
                'name'        => 'Roma Kelapa 300 gr',
                'category_id' => $catMakanan?->id ?? 2,
                'supplier_id' => $supplier->id,
                'buy_price'   => 9500,
                'sell_price'  => 12000,
                'stock'       => 60,
                'min_stock'   => 10,
                'unit'        => 'bungkus',
            ],

            /* ── MINUMAN (2 produk) ── */
            [
                'sku'         => 'SKU-AQUA-001',
                'barcode'     => '8999999800017',
                'name'        => 'Aqua Galon 19 Liter',
                'category_id' => $catMinuman?->id ?? 3,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 18000,
                'sell_price'  => 22000,
                'stock'       => 30,
                'min_stock'   => 5,
                'unit'        => 'galon',
            ],
            [
                'sku'         => 'SKU-TEHBOTOL-001',
                'barcode'     => '8999999800018',
                'name'        => 'Teh Botol Sosro 450 ml',
                'category_id' => $catMinuman?->id ?? 3,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 4000,
                'sell_price'  => 6000,
                'stock'       => 3,   // sengaja stok menipis buat demo alert
                'min_stock'   => 12,
                'unit'        => 'botol',
            ],

            /* ── ROKOK (1 produk) ── */
            [
                'sku'         => 'SKU-GG-001',
                'barcode'     => '8999999800019',
                'name'        => 'Gudang Garam Surya 12 Pro',
                'category_id' => $catRokok?->id ?? 4,
                'supplier_id' => $supplierRokok->id,
                'buy_price'   => 24000,
                'sell_price'  => 27000,
                'stock'       => 50,
                'min_stock'   => 10,
                'unit'        => 'bungkus',
            ],

            /* ── HOUSEHOLD (1 produk) ── */
            [
                'sku'         => 'SKU-SABUN-001',
                'barcode'     => '8999999800020',
                'name'        => 'Sabun Lifebuoy Total 10 110 gr',
                'category_id' => $catHousehold?->id ?? 7,
                'supplier_id' => $supplierUmum->id,
                'buy_price'   => 4500,
                'sell_price'  => 6500,
                'stock'       => 100,
                'min_stock'   => 15,
                'unit'        => 'pcs',
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['sku' => $product['sku']],
                array_merge($product, [
                    'description' => null,
                    'photo'       => null,
                    'is_active'   => true,
                ])
            );
        }

        $this->command->info('✅ 10 produk berhasil ditambahkan.');
    }
}
