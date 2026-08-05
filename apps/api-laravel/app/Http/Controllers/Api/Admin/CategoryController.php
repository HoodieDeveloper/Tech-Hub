<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $this->createUniqueSlug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name']) && $validated['name'] !== $category->name) {
            $validated['slug'] = $this->createUniqueSlug(
                $validated['name'],
                $category->id
            );
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => $category->fresh()->loadCount('products'),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }

    private function createUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $number = 1;

        while (
            Category::query()
                ->where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $number;
            $number++;
        }

        return $slug;
    }
}