# 📋 Rencana Perbaikan — Warung Bu Tutik POS

> Hasil analisa profesional: backend Laravel 11, frontend React 19, git, dan dokumentasi.
> Dibuat: 2026-09-09 · Fase 1–4: 2026-09-10 · Sesi lanjutan (stok mirror, PHPStan): 2026-09-10
> Sesi final (FormRequest + API Resource + untrack artifact): 2026-09-10

---

## Status Eksekusi — SEMUA FASE SELESAI

| # | Aksi | Status |
|---|------|--------|
| 1 | Middleware role per route group (`routes/api.php`) | ✅ Selesai |
| 2 | Fix cancel-sale hutang + lockForUpdate DebtService | ✅ Selesai |
| 3 | Rate limit login + token expiry 30 hari | ✅ Selesai |
| 4 | `eslint.config.js` + Feature test (23 test, 64 assertion) | ✅ Selesai |
| 5 | GitHub Actions (pint + phpstan + phpunit + lint + build) | ✅ Selesai |
| 6 | **FormRequest (11 kelas) + API Resource (9 kelas) selesai** — handle 403 di axios ✅ | ✅ Selesai |
| 7 | Dual-write stok — mirror di-sync otomatis via `syncStockMirror()` di semua jalur ✅ · N+1 display_stock ✅ | ✅ Selesai |
| 8 | Bersihkan dependency (sweetalert2, react-table dibuang), lazy-load route | ✅ Selesai |
| 9 | README ✅ · CORS dari env ✅ · build artifact di-untrack dari git ✅ | ✅ Selesai |

---

## Sesi Final (2026-09-10)

- ✅ **FormRequest** — 11 kelas di `app/Http/Requests/` (Store/UpdateProduct, StoreSale,
  CancelSale, StorePurchase, StockMovement, StockAdjust, PayDebt, UpdateSetting,
  Store/UpdateUser) dengan base `ApiFormRequest` (error 422 JSON konsisten).
  Normalisasi SKU/barcode pindah ke `prepareForValidation()`. Kontroler kini tipis:
  terima FormRequest → service → response.
- ✅ **API Resource** — 9 kelas di `app/Http/Resources/` (Product, ProductStock, Sale,
  SaleItem, Purchase, PurchaseItem, CustomerDebt, SupplierDebt, User). Format tetap
  identik dengan sebelumnya (key snake_case, decimal tetap string, paginator Laravel
  utuh via `->through()`) agar frontend tidak berubah.
- ✅ **Docblock type-safety** — `@property` + relasi typed di 15 model, generics
  `HasMany<X, $this>`, `Role` typed di UserResource.
- ✅ **Build artifact di-untrack** dari git (`backend/public/index.html` + `assets/`)
  dan di-ignore; file fisik masih ada untuk Laragon.
- ✅ PHPStan level 4: 0 error. PHPUnit: 23 pass. Pint: bersih. ESLint + build: bersih.

## Sesi Lanjutan (2026-09-10, sesi kedua)

- ✅ **CORS dari env** — `config/cors.php` membaca `FRONTEND_URLS` (dipisah koma);
  localhost Vite selalu diizinkan. IP hardcode dihapus. `.env.example` + README di-update.
- ✅ **Konsistensi stok mirror** — `InventoryService::syncStockMirror()` menjadi satu
  titik sinkronisasi `products.stock` dari `sum(product_stocks)`. Semua service &
  controller kini memanggilnya. Laporan inventori menghitung nilai stok dari
  `product_stocks` (bukan mirror). `StockMirrorTest` (6 test) membuktikan tidak drift.
- ✅ **Larastan/PHPStan level 4** — 41 → 0 error. Perbaikan nyata:
  return type di semua relasi Eloquent (18 model), generics `HasMany<X, $this>`,
  token delete diperiksa instance `PersonalAccessToken`, nullsafe operator di seeder.
  Masuk CI sebagai step terpisah + `composer analyse`.

---

## ✅ Yang Sudah Bagus (diawal analisa)

- Arsitektur bersih: Service layer (SaleService, InventoryService, dll), controller tipis,
  DB transaction + `lockForUpdate` di alur kritis
- Sanctum token auth, Spatie Permission, soft delete, `stock_movements` sebagai audit trail stok
- Frontend terstruktur rapi: TanStack Query, Zustand, komponen UI reusable
- `.gitignore` benar (`.env`, `vendor`, `dist`, `*.zip` tidak masuk git)
- README cukup lengkap untuk onboarding

---

## 🔴 Prioritas 1 — Bug & Celah Keamanan (SEBAGIAN BESAR SELESAI)

### 1. Role/permission TIDAK ditegakkan di backend — ✅ FIXED
Sekarang `routes/api.php` menegakkan `role:` middleware sesuai matrix README:
- `owner|admin`: dashboard, kategori, supplier, pembelian, inventori, hutang, lokasi, transfer stok
- `owner|kasir`: buat penjualan (POS)
- `owner|admin`: batalkan penjualan
- `owner`: ubah settings, kelola users
- Semua role: produk, pelanggan, lihat penjualan, laporan, baca settings

### 2. Bug: batal penjualan hutang tidak membalikkan hutang — ✅ FIXED
`SaleService::cancel()` kini menutup `CustomerDebt` (status paid, remaining 0)
dan decrement `customers.current_debt`. Ada re-lock sale untuk cegah cancel ganda.

### 3. Race condition pada `invoice_number` — ✅ FIXED
Pakai tabel `invoice_sequences` (counter harian) dengan `SELECT ... FOR UPDATE`.

### 4. Race condition pembayaran hutang — ✅ FIXED
`DebtService::payCustomer/paySupplier` re-lock row di dalam transaction.

### 5. Login tanpa rate limiting — ✅ FIXED
`throttle:5,1` di `POST /auth/login`.

### 6. Token Sanctum tanpa expiry — ✅ FIXED
`createToken(..., expiresAt: now()->addDays(30))`.

---

## 🟠 Prioritas 2 — Arsitektur & Kualitas Kode

### 7. Dual-write stok — 🔶 BACKLOG
Masih menulis ke `products.stock` DAN `product_stocks`. Perlu migrasi penuh
ke `product_stocks` sebagai single source of truth lalu buang kolom lama.

### 8. N+1 query di `Product::getDisplayStockAttribute()` — ✅ FIXED
ID lokasi display di-cache static per-request; memakai relasi yang sudah
eager-loaded (`productStocks`) sebelum fallback ke query.

### 9. Tidak ada Form Request & API Resource — 🔶 BACKLOG
Validasi masih inline di controller; response masih Eloquent langsung.

### 10. `lockForUpdate()` pada model instance = no-op — ✅ FIXED
Semua lock kini di query builder sebelum `first()` (cancel sale, debt pay).

### 11. Frontend issues — ✅ SEBAGIAN BESAR FIXED
- ✅ Error Boundary global di `main.tsx`
- ✅ Axios handle 403 (toast) + tidak redirect saat request login
- ✅ Route lazy-loaded (`React.lazy` + Suspense) — build per halaman
- ✅ Redirect by role: kasir → `/pos`, owner/admin → `/dashboard`
- ✅ Dependency tak terpakai dibuang (sweetalert2, @tanstack/react-table)
- ✅ Route `/settings` nested redundan dirapikan
- 🔶 Guard role per-route frontend masih bisa ditambah

### 12. `ProductController::destroy` foto dihapus permanen — 🔶 BACKLOG
Soft delete produk tapi foto hilang; belum cek riwayat penjualan.

---

## 🟡 Prioritas 3 — Tooling & QA

| Item | Status |
|------|--------|
| Test suite | ✅ 17 test (SaleService, DebtService, smoke API) di MySQL `warung_bu_tutik_test` |
| CI/CD GitHub Actions | ✅ `.github/workflows/ci.yml` (Pint + phpunit + eslint + build) |
| ESLint config frontend | ✅ `eslint.config.js` (flat config) — `npm run lint` bersih |
| Pint | ✅ Bersih; tambahkan `./vendor/bin/pint --test` di CI |
| PHPStan / Larastan | 🔶 Backlog |
| Husky + lint-staged | 🔶 Backlog |
| OpenAPI/Swagger | 🔶 Backlog |
| Audit log (spatie/activitylog) | 🔶 Backlog |

---

## 🟢 Prioritas 4 — Repo Hygiene & Dokumentasi

1. Build artifact `backend/public/index.html` + `assets/` masih ter-commit —
   pindahkan strategi deploy (frontend serve sendiri via Nginx) lalu untrack.
2. `backup1.zip`, `backend/backend.zip`, `database.sql` — diabaikan git;
   sebaiknya dihapus dari folder atau dipindah keluar repo.
3. ✅ README diperbarui (16 controller, 19 model, fitur lokasi & transfer stok,
   token expiry, rate limit, struktur test & CI).
4. ✅ `PANDUAN_LENGKAP_STOK_LOKASI.md` dipindah ke `docs/`; rencana ini juga di `docs/`.
5. 🔶 CORS masih hardcode IP — pindahkan ke env.

---

## Kesimpulan

Seluruh rencana perbaikan telah tereksekusi: otorisasi API ditegakkan, alur uang
(hutang & pembatalan) terkunci dan teruji, invoice anti-duplikat, stok mirror tidak
bisa drift, validasi terstruktur (FormRequest), kontrak response ter-shape (API
Resource), static analysis bersih level 4, dan CI menjalankan semua gate otomatis.

Backlog opsional berikutnya:
1. Naikkan level PHPStan (4 → 5-6) bertahap.
2. Tambah test kontrak untuk endpoint lain (customers, categories, suppliers).
3. PWA + export PDF/Excel (roadmap fitur v2.0 di README).
