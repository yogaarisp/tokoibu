<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'store_name'    => 'required|string|max:150',
            'store_address' => 'nullable|string|max:255',
            'store_phone'   => 'nullable|string|max:30',
            'tax_rate'      => 'nullable|numeric|min:0|max:100',
            'currency'      => 'nullable|string|max:10',
            'receipt_note'  => 'nullable|string|max:255',
        ]);

        foreach ($request->only(['store_name', 'store_address', 'store_phone', 'tax_rate', 'currency', 'receipt_note']) as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
