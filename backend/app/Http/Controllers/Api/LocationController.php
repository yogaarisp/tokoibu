<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index()
    {
        $locations = Location::orderBy('name')->get();
        return response()->json($locations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:warehouse,display',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $location = Location::create($validated);
        return response()->json($location, 201);
    }

    public function show(Location $location)
    {
        $location->load('productStocks.product');
        return response()->json($location);
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'string|max:100',
            'type' => 'in:warehouse,display',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);
        return response()->json($location);
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return response()->json(null, 204);
    }
}
