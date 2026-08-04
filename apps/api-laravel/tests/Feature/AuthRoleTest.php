<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_always_creates_customer(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Customer One',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.role', User::ROLE_CUSTOMER);

        $this->assertDatabaseHas('users', [
            'email' => 'customer@example.com',
            'role' => User::ROLE_CUSTOMER,
        ]);
    }

    public function test_same_login_endpoint_returns_admin_role(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonPath('user.role', User::ROLE_ADMIN)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_admin_dashboard_is_role_protected(): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
        ]));

        $this->getJson('/api/admin/dashboard')->assertForbidden();

        Sanctum::actingAs(User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]));

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'products',
                'active_products',
                'out_of_stock_products',
                'customers',
                'admins',
            ]);
    }
}
