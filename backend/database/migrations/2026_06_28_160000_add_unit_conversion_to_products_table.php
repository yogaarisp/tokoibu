<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('unit_warehouse')->default('pcs')->after('unit');
            $table->integer('unit_conversion')->default(1)->after('unit_warehouse');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['unit_warehouse', 'unit_conversion']);
        });
    }
};