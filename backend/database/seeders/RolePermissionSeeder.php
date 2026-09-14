<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = ['dashboard', 'produk', 'kategori', 'supplier', 'pelanggan', 'kasir', 'laporan', 'hutang', 'pengaturan'];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $owner = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $owner->syncPermissions($permissions);

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(['dashboard', 'produk', 'supplier', 'pelanggan', 'laporan', 'hutang']);

        $kasir = Role::firstOrCreate(['name' => 'kasir', 'guard_name' => 'web']);
        $kasir->syncPermissions(['kasir', 'produk', 'pelanggan', 'laporan']);
    }
}
