<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Untuk pure token-based API, tidak perlu EnsureFrontendRequestsAreStateful
        // Middleware tersebut hanya dibutuhkan untuk SPA cookie/session auth

        $middleware->alias([
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });

        $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, Request $request) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            return response()->json([
                'message' => 'Data tidak valid.',
                'errors'  => $e->errors(),
            ], 422);
        });
    })->create();
