# Panduan Lengkap Implementasi Fitur Stok per Lokasi (Opsi 2 Lengkap)

## 📋 Overview
Fitur ini memungkinkan:
- Mengelola lokasi stok (Gudang, Rak Display, Rak A, dll)
- Melihat stok per lokasi untuk setiap produk
- Memindahkan stok antar lokasi
- Transaksi POS hanya mengurangi stok di lokasi "Rak Display"

---

## 🗄️ 1. Perubahan Database

### 1.1 Buat Migration Lokasi Stok
Buat migration baru:
```bash
cd backend
php artisan make:migration create_locations_table
```

Isi file migration:
```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100); // Nama lokasi (Gudang, Rak Display, dll)
            $table->string('type', 50)->default('warehouse'); // warehouse / display
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('locations'); }
};
```

### 1.2 Buat Migration Stok Produk per Lokasi
Buat migration baru:
```bash
php artisan make:migration create_product_stocks_table
```

Isi file migration:
```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->integer('stock')->default(0);
            $table->integer('min_stock')->default(0);
            $table->timestamps();
            
            $table->unique(['product_id', 'location_id']); // Satu produk per lokasi
        });
    }
    public function down(): void { Schema::dropIfExists('product_stocks'); }
};
```

### 1.3 Buat Migration Pindah Stok (Stock Transfer)
Buat migration baru:
```bash
php artisan make:migration create_stock_transfers_table
```

Isi file migration:
```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number', 50)->unique(); // Nomor pindah stok
            $table->foreignId('from_location_id')->constrained('locations')->restrictOnDelete();
            $table->foreignId('to_location_id')->constrained('locations')->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('quantity');
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->timestamp('transferred_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('stock_transfers'); }
};
```

### 1.4 Tambahkan Kolom Location ID ke Stock Movements
Buat migration baru:
```bash
php artisan make:migration add_location_id_to_stock_movements_table
```

Isi file migration:
```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn('location_id');
        });
    }
};
```

### 1.5 Jalankan Migration
```bash
php artisan migrate
```

---

## 🛠️ 2. Backend Implementation (Laravel)

### 2.1 Buat Model Location
Buat file `backend/app/Models/Location.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Location extends Model {
    use SoftDeletes;
    protected $fillable = ['name', 'type', 'description', 'is_active'];
    
    // Relasi ke stok produk
    public function productStocks() { return $this->hasMany(ProductStock::class); }
}
```

### 2.2 Buat Model ProductStock
Buat file `backend/app/Models/ProductStock.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class ProductStock extends Model {
    use SoftDeletes;
    protected $fillable = ['product_id', 'location_id', 'stock', 'min_stock'];
    
    public function product() { return $this->belongsTo(Product::class); }
    public function location() { return $this->belongsTo(Location::class); }
}
```

### 2.3 Buat Model StockTransfer
Buat file `backend/app/Models/StockTransfer.php`:
```php
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class StockTransfer extends Model {
    use SoftDeletes;
    protected $fillable = ['transfer_number', 'from_location_id', 'to_location_id', 'product_id', 'quantity', 'notes', 'user_id', 'transferred_at'];
    
    public function fromLocation() { return $this->belongsTo(Location::class, 'from_location_id'); }
    public function toLocation() { return $this->belongsTo(Location::class, 'to_location_id'); }
    public function product() { return $this->belongsTo(Product::class); }
    public function user() { return $this->belongsTo(User::class); }
    
    // Generate nomor pindah stok otomatis
    protected static function boot() {
        parent::boot();
        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = 'TRF-' . date('YmdHis') . '-' . str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
```

### 2.4 Update Model Product
Edit file `backend/app/Models/Product.php`:
```php
// Tambahkan di bagian relasi
public function productStocks() { return $this->hasMany(ProductStock::class); }

// Hitung total stok dari semua lokasi
public function getTotalStockAttribute() { return $this->productStocks->sum('stock'); }

// Dapatkan stok di lokasi display
public function getDisplayStockAttribute() {
    $displayLocation = Location::where('type', 'display')->first();
    return $displayLocation ? $this->productStocks()->where('location_id', $displayLocation->id)->first()?->stock ?? 0 : 0;
}
```

### 2.5 Buat Seeder Lokasi Default
Buat seeder:
```bash
php artisan make:seeder LocationSeeder
```

Isi file:
```php
<?php
namespace Database\Seeders;
use App\Models\Location;
use Illuminate\Database\Seeder;
class LocationSeeder extends Seeder {
    public function run(): void {
        Location::create(['name' => 'Gudang', 'type' => 'warehouse', 'description' => 'Lokasi penyimpanan utama']);
        Location::create(['name' => 'Rak Display', 'type' => 'display', 'description' => 'Lokasi produk yang dijual']);
    }
}
```

Jalankan seeder:
```bash
php artisan db:seed --class=LocationSeeder
```

### 2.6 Buat LocationController
Buat file `backend/app/Http/Controllers/Api/LocationController.php`:
```php
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
```

### 2.7 Buat StockTransferController
Buat file `backend/app/Http/Controllers/Api/StockTransferController.php`:
```php
<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\Location;
use App\Models\ProductStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index()
    {
        $transfers = StockTransfer::with(['fromLocation', 'toLocation', 'product', 'user'])
            ->orderBy('transferred_at', 'desc')
            ->paginate(20);
        return response()->json($transfers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $fromStock = ProductStock::where('product_id', $validated['product_id'])
                ->where('location_id', $validated['from_location_id'])
                ->lockForUpdate()
                ->first();

            if (!$fromStock || $fromStock->stock < $validated['quantity']) {
                abort(400, 'Stok di lokasi asal tidak mencukupi');
            }

            $fromStock->decrement('stock', $validated['quantity']);

            $toStock = ProductStock::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['to_location_id'],
                ],
                ['stock' => 0, 'min_stock' => 0]
            );
            $toStock->increment('stock', $validated['quantity']);

            $transfer = StockTransfer::create($validated);
            $transfer->load(['fromLocation', 'toLocation', 'product', 'user']);

            return response()->json($transfer, 201);
        });
    }

    public function show(StockTransfer $stockTransfer)
    {
        $stockTransfer->load(['fromLocation', 'toLocation', 'product', 'user']);
        return response()->json($stockTransfer);
    }
}
```

### 2.8 Update Routes API
Edit file `backend/routes/api.php`:
```php
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\StockTransferController;

// Tambahkan di dalam group middleware auth:sanctum
Route::apiResource('locations', LocationController::class);
Route::apiResource('stock-transfers', StockTransferController::class)->only(['index', 'show', 'store']);
```

### 2.9 Update StockMovement Model
Edit file `backend/app/Models/StockMovement.php`:
```php
protected $fillable = ['product_id', 'location_id', 'user_id', 'type', 'quantity_before', 'quantity_change', 'quantity_after', 'reference_type', 'reference_id', 'notes'];

public function location() { return $this->belongsTo(Location::class); }
```

### 2.10 Update InventoryService
Edit file `backend/app/Services/InventoryService.php`:
Tambahkan parameter `location_id` pada method `stockIn`, `stockOut`, dan `stockAdjust`. Gunakan lokasi default (warehouse untuk stockIn, display untuk stockOut) jika tidak diberikan.

### 2.11 Update PurchaseService dan SaleService
- PurchaseService: Tambahkan stok ke lokasi warehouse saat penerimaan PO
- SaleService: Kurangi stok dari lokasi display saat transaksi penjualan

---

## 🌐 3. Frontend Implementation (React)

### 3.1 Tambahkan API Types
Edit file `frontend/src/types/index.ts`:
```typescript
export interface Location {
  id: number;
  name: string;
  type: 'warehouse' | 'display';
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductStock {
  id: number;
  product_id: number;
  location_id: number;
  stock: number;
  min_stock: number;
  location: Location;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  from_location_id: number;
  to_location_id: number;
  product_id: number;
  quantity: number;
  notes: string | null;
  user_id: number;
  transferred_at: string;
  fromLocation: Location;
  toLocation: Location;
  product: Product;
  user: User;
}
```

### 3.2 Tambahkan API Calls
Edit file `frontend/src/api/index.ts`:
```typescript
import api from './axios';

export const locationApi = {
  getAll: () => api.get<Location[]>('/locations'),
  getById: (id: number) => api.get<Location>(`/locations/${id}`),
  create: (data: Partial<Location>) => api.post<Location>('/locations', data),
  update: (id: number, data: Partial<Location>) => api.put<Location>(`/locations/${id}`, data),
  delete: (id: number) => api.delete(`/locations/${id}`),
};

export const stockTransferApi = {
  getAll: () => api.get<PaginatedResponse<StockTransfer>>('/stock-transfers'),
  getById: (id: number) => api.get<StockTransfer>(`/stock-transfers/${id}`),
  create: (data: {
    from_location_id: number;
    to_location_id: number;
    product_id: number;
    quantity: number;
    notes?: string;
  }) => api.post<StockTransfer>('/stock-transfers', data),
};
```

### 3.3 Buat Halaman Lokasi Stok
Buat file `frontend/src/pages/inventory/LocationsPage.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { locationApi } from '../../api';
import { Location } from '../../types';
import { Link } from 'react-router-dom';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await locationApi.getAll();
      setLocations(res.data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lokasi Stok</h1>
        <Link to="/locations/create" className="bg-blue-500 text-white px-4 py-2 rounded">
          Tambah Lokasi
        </Link>
      </div>
      <div className="grid gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className="border rounded p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold">{loc.name}</h3>
                <p className="text-sm text-gray-500">
                  {loc.type === 'warehouse' ? 'Gudang' : 'Rak Display'}
                </p>
                {loc.description && <p className="text-sm">{loc.description}</p>}
              </div>
              <div className="flex gap-2">
                <Link to={`/locations/${loc.id}`} className="text-blue-500">
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.4 Buat Halaman Pindah Stok
Buat file `frontend/src/pages/inventory/StockTransferPage.tsx`:
```tsx
import React, { useState, useEffect } from 'react';
import { locationApi, productApi, stockTransferApi } from '../../api';
import { Location, Product } from '../../types';

export default function StockTransferPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    from_location_id: '',
    to_location_id: '',
    product_id: '',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [locRes, prodRes] = await Promise.all([
      locationApi.getAll(),
      productApi.getAll(),
    ]);
    setLocations(locRes.data);
    setProducts(prodRes.data.data || prodRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stockTransferApi.create({
        ...form,
        from_location_id: parseInt(form.from_location_id),
        to_location_id: parseInt(form.to_location_id),
        product_id: parseInt(form.product_id),
        quantity: parseInt(form.quantity),
      });
      alert('Pindah stok berhasil!');
      setForm({ from_location_id: '', to_location_id: '', product_id: '', quantity: '', notes: '' });
    } catch (error) {
      alert('Gagal memindahkan stok');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pindah Stok</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Dari Lokasi</label>
          <select
            value={form.from_location_id}
            onChange={(e) => setForm({ ...form, from_location_id: e.target.value })}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Pilih lokasi</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Ke Lokasi</label>
          <select
            value={form.to_location_id}
            onChange={(e) => setForm({ ...form, to_location_id: e.target.value })}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Pilih lokasi</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Produk</label>
          <select
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Pilih produk</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Jumlah</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full border rounded p-2"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Catatan</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Pindah Stok
        </button>
      </form>
    </div>
  );
}
```

### 3.5 Tambahkan Route
Edit file `frontend/src/App.tsx`:
```tsx
import LocationsPage from './pages/inventory/LocationsPage';
import StockTransferPage from './pages/inventory/StockTransferPage';

// Tambahkan di dalam Routes
<Route path="/locations" element={<LocationsPage />} />
<Route path="/stock-transfers" element={<StockTransferPage />} />
```

---

## 🚀 4. Deployment Checklist
- [ ] Jalankan migration di server
- [ ] Jalankan seeder lokasi default
- [ ] Update file frontend
- [ ] Build frontend dan upload ke server

