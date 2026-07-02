<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Bu Tutik',      'email' => 'owner@warungbutik.com', 'role' => 'owner'],
            ['name' => 'Admin Warung',  'email' => 'admin@warungbutik.com', 'role' => 'admin'],
            ['name' => 'Kasir Warung',  'email' => 'kasir@warungbutik.com', 'role' => 'kasir'],
        ];

        foreach ($accounts as $acc) {
            $user = User::firstOrCreate(
                ['email' => $acc['email']],
                ['name' => $acc['name'], 'password' => Hash::make('password'), 'email_verified_at' => now(), 'is_active' => true]
            );
            $user->syncRoles([$acc['role']]);
        }
    }
}
