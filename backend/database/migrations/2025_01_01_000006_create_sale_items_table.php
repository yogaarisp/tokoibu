<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('product_name', 200);
            $table->integer('quantity');
            $table->decimal('buy_price', 12, 2);
            $table->decimal('sell_price', 12, 2);
            $table->decimal('discount', 5, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('sale_items'); }
};
