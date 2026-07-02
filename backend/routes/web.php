<?php

use Illuminate\Support\Facades\Route;

// Serve SPA
Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});

// Fallback untuk SPA routing
Route::fallback(function () {
    return file_get_contents(public_path('index.html'));
});
