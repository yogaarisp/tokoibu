<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('roles:id,name')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")
            )
            ->latest()->paginate($request->per_page ?? 20);

        return response()->json([
            'users' => $users->through(fn ($user) => (new UserResource($user))->resolve($request)),
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole($data['role']);

        return response()->json(new UserResource($user->load('roles:id,name')), 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        $updateData = ['name' => $data['name'], 'email' => $data['email']];
        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);
        $user->syncRoles([$data['role']]);

        return response()->json(new UserResource($user->fresh()->load('roles:id,name')));
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Tidak bisa hapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
