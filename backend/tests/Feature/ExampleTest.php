<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_successful_response(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }

    public function test_login_endpoint_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_protected_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(401);
    }
}
