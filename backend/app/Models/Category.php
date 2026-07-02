<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'slug', 'icon', 'description', 'is_active'];
    protected $casts    = ['is_active' => 'boolean'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->slug = Str::slug($m->name));
        static::updating(fn($m) => $m->slug = Str::slug($m->name));
    }

    public function scopeActive($q) { return $q->where('is_active', true); }

    public function products() { return $this->hasMany(Product::class); }
}
