<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Laptops',
            'Phones',
            'Tablets',
            'Desktop Computers',
            'Monitors',
            'Keyboards',
            'Mice',
            'Headphones',
            'Speakers',
            'Printers',
            'Computer Parts',
            'Storage Devices',
            'Networking',
            'Accessories',
        ];

        foreach ($categories as $name) {
            Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => null,
                    'is_active' => true,
                ]
            );
        }
    }
}