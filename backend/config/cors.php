<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CORS Configuration
    |--------------------------------------------------------------------------
    | Untuk pure token-based API, supports_credentials = false
    | Origins frontend dikonfigurasi via env (FRONTEND_URLS, dipisah koma),
    | localhost Vite selalu diizinkan untuk development.
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_merge([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ], array_filter(explode(',', (string) env('FRONTEND_URLS', '')))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // false karena kita pakai Bearer token, bukan cookie
    'supports_credentials' => false,
];
