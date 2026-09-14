<?php

use App\Exceptions\BusinessException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Untuk pure token-based API, tidak perlu EnsureFrontendRequestsAreStateful
        // Middleware tersebut hanya dibutuhkan untuk SPA cookie/session auth

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (BusinessException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });

        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            return response()->json([
                'message' => 'Data tidak valid.',
                'errors' => $e->errors(),
            ], 422);
        });
    })->create();
