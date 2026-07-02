<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Set guard untuk Spatie Permission
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionClass(\Spatie\Permission\Models\Permission::class);
    }
}
