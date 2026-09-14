<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::query()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        foreach ($request->validated() as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
