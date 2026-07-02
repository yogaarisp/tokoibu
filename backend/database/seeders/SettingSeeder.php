<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'store_name',    'value' => 'Warung Bu Tutik',          'group' => 'general'],
            ['key' => 'store_address', 'value' => 'Jl. Contoh No. 1',         'group' => 'general'],
            ['key' => 'store_phone',   'value' => '08123456789',               'group' => 'general'],
            ['key' => 'tax_rate',      'value' => '0',                         'group' => 'pos'],
            ['key' => 'currency',      'value' => 'Rp',                        'group' => 'pos'],
            ['key' => 'receipt_note',  'value' => 'Terima kasih sudah berbelanja!', 'group' => 'pos'],
        ];

        foreach ($defaults as $s) {
            Setting::firstOrCreate(['key' => $s['key']], $s);
        }
    }
}
