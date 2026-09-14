<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::withCount('products')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->per_page ?? 20);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $this->ensureSlugAvailable(Str::slug($data['name']));

        $category = Category::create($data);

        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json($category->loadCount('products'));
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (array_key_exists('name', $data)) {
            $slug = Str::slug($data['name']);
            if ($slug !== $category->slug) {
                $this->ensureSlugAvailable($slug, $category->id);
            }
        }

        $category->update($data);

        return response()->json($category->fresh());
    }

    private function ensureSlugAvailable(string $slug, ?int $ignoreId = null): void
    {
        $query = Category::withTrashed()->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->whereKeyNot($ignoreId);
        }

        if ($query->exists()) {
            abort(response()->json([
                'message' => 'Data tidak valid.',
                'errors' => ['name' => ['Nama kategori sudah digunakan.']],
            ], 422));
        }
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Kategori memiliki produk, tidak bisa dihapus.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }
}
