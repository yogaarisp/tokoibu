# 🏪 Warung Bu Tutik — POS System

> Belanja Mudah, Cepat dan Lengkap

Aplikasi **Point of Sale (POS)** lengkap untuk warung sembako, toko kelontong,
dan minimarket skala kecil hingga menengah.
Arsitektur **Backend API terpisah ↔ Frontend SPA** — mobile-friendly, bisa diakses dari HP maupun browser desktop.

---

## 📁 Struktur Proyek

```
Toko/
├── backend/      ← Laravel 11 REST API (port 8000)
├── frontend/     ← React 19 + Vite SPA  (port 5173+)
├── README.md
└── warung.md     ← PRD original
```

---

## 🛠 Tech Stack

### Backend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| PHP | 8.2+ | Runtime |
| Laravel | 11.x | Framework |
| Laravel Sanctum | 4.x | Token-based auth |
| Spatie Permission | 6.x | Role & Permission |
| MySQL | 8+ | Database |
| barryvdh/laravel-dompdf | 3.x | Export PDF |

### Frontend
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| React Router | 7.x | SPA routing |
| TanStack Query | 5.x | Server state & caching |
| Zustand | 5.x | Client state (cart, auth, settings) |
| Tailwind CSS | 3.x | Styling |
| Chart.js + react-chartjs-2 | 4.x | Charts & graphs |
| @zxing/library | 0.22 | Barcode scanner via kamera |
| lucide-react | 0.475 | Icons |
| react-hot-toast | 2.x | Notifications |

---

## 👥 Role & Permission

| Modul            | Owner | Admin | Kasir |
|------------------|:-----:|:-----:|:-----:|
| Dashboard        | ✅    | ✅    | —     |
| Kasir / POS      | ✅    | —     | ✅    |
| Produk           | ✅    | ✅    | ✅    |
| Kategori         | ✅    | —     | —     |
| Supplier         | ✅    | ✅    | —     |
| Pelanggan        | ✅    | ✅    | ✅    |
| Penjualan        | ✅    | ✅    | ✅    |
| Pembelian (PO)   | ✅    | ✅    | —     |
| Inventori        | ✅    | ✅    | —     |
| Hutang           | ✅    | ✅    | —     |
| Laporan          | ✅    | ✅    | ✅    |
| Pengguna         | ✅    | —     | —     |
| Pengaturan       | ✅    | —     | —     |
| Printer          | ✅    | —     | —     |

---

## 🚀 Instalasi

### Prasyarat
- PHP 8.2+, Composer 2+
- Node.js 20+, npm
- MySQL 8+
- Laragon / XAMPP / Herd

---

### 1 — Backend (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Edit .env — sesuaikan:
# DB_DATABASE=warung_bu_tutik
# DB_USERNAME=root
# DB_PASSWORD=

# Buat database MySQL
# mysql -u root -e "CREATE DATABASE warung_bu_tutik CHARACTER SET utf8mb4;"

# Migrasi + Seeder
php artisan migrate --seed

# Storage link (untuk foto produk)
php artisan storage:link

# Jalankan server (localhost saja)
php artisan serve --port=8000

# Atau akses dari HP di jaringan yang sama
php artisan serve --host=0.0.0.0 --port=8000
```

---

### 2 — Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
# → http://localhost:5173
# → http://192.168.x.x:5173  (akses dari HP, lihat bagian LAN)

# Production build
npm run build
```

> Vite proxy `/api/*` dan `/storage/*` otomatis ke `http://localhost:8000`

---

## 🔐 Default Login

| Role  | Email                       | Password |
|-------|-----------------------------|----------|
| Owner | owner@warungbutik.com       | password |
| Admin | admin@warungbutik.com       | password |
| Kasir | kasir@warungbutik.com       | password |

> ⚠️ **Ganti password default setelah pertama login!**

---

## � Akses dari HP / LAN

Untuk akses dari HP di jaringan WiFi yang sama:

1. Cari IP komputer: `ipconfig` → lihat **IPv4 Address**
2. Jalankan backend dengan `--host=0.0.0.0`
3. Jalankan frontend (`npm run dev` sudah otomatis expose ke network)
4. Buka di HP: `http://192.168.x.x:5173`
5. Buka port di Windows Firewall (perlu sekali):

```powershell
# Jalankan sebagai Administrator
New-NetFirewallRule -DisplayName "Warung Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "Warung Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private
```

---

## ✨ Fitur Lengkap

### 🛒 POS / Kasir
- Produk langsung muncul saat halaman dibuka
- Search produk real-time
- Scan barcode via **kamera HP/webcam** (Web Camera API + @zxing)
- Support scanner hardware USB/Bluetooth (auto-detect keyboard input)
- Cart dengan qty control, hapus item
- Pilih pelanggan (opsional)
- Metode bayar: Tunai, QRIS, Transfer, Hutang
- Kalkulasi kembalian otomatis
- Mobile: **floating cart bar** di atas bottom nav + **cart sheet** slide-up
- Struk digital setelah transaksi

### 🖨️ Print Struk
- **Print Bluetooth** — koneksi langsung ke thermal printer via Web Bluetooth API
  - Support 58mm dan 80mm paper
  - ESC/POS commands (Epson, Gprinter, Xprinter, Rongta, dll)
  - Test print dari halaman `/settings/printer`
- **Print Browser** — popup window HTML seukuran struk
  - Tidak perlu driver khusus
  - Support semua printer yang terinstall di komputer

### 📦 Manajemen Produk
- CRUD dengan foto produk
- Generate SKU otomatis
- Scan barcode kemasan untuk isi field barcode (via kamera)
- Preview margin keuntungan realtime
- Filter per kategori
- Alert stok menipis

### 📊 Dashboard
- Statistik realtime (produk, stok, penjualan hari ini, pendapatan bulan)
- Chart penjualan 7 hari + pendapatan 6 bulan
- Top 5 produk terlaris
- Alert produk stok menipis
- Quick actions

### 📋 Laporan
- Laporan penjualan: harian, mingguan, bulanan, tahunan, custom range
- Laporan inventori: nilai stok, stok menipis, habis
- Laporan laba rugi dengan margin %
- Best selling products

### 💰 Manajemen Hutang
- Hutang pelanggan (piutang) — otomatis dari transaksi bayar hutang
- Hutang supplier — dari purchase order
- Cicilan pembayaran
- Riwayat pembayaran

### 🏭 Purchase Order
- Buat PO ke supplier
- Penerimaan barang → stok otomatis bertambah, harga beli terupdate
- Riwayat PO dengan status

### 📱 Mobile Responsive
- Layout adaptif desktop & mobile
- **Floating bottom navigation** (dark pill style) dengan POS button di tengah
- Sidebar collapsible di desktop
- Semua form sebagai **bottom sheet** di mobile
- Font & spacing yang optimal untuk layar kecil

---

## 📡 API Endpoints

Base URL: `http://localhost:8000/api/v1`

Semua endpoint (kecuali login) membutuhkan header:
```
Authorization: Bearer {token}
Accept: application/json
```

### Auth
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/auth/login` | Login, returns token |
| POST | `/auth/logout` | Logout, revoke token |
| GET  | `/auth/me` | Data user yang login |

### Products
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/products` | List produk (filter: search, category_id, low_stock) |
| POST | `/products` | Tambah produk (multipart/form-data untuk foto) |
| GET | `/products/{id}` | Detail produk |
| PUT | `/products/{id}` | Update produk |
| DELETE | `/products/{id}` | Hapus produk |
| GET | `/products/search/barcode?barcode=xxx` | Cari by barcode |

### Master Data
```
GET|POST             /categories
GET|PUT|DELETE       /categories/{id}

GET|POST             /suppliers
GET|PUT|DELETE       /suppliers/{id}

GET|POST             /customers
GET|PUT|DELETE       /customers/{id}
GET                  /customers/{id}/history
```

### Sales
```
GET    /sales                      (filter: search, status, from, to)
POST   /sales
GET    /sales/{id}
POST   /sales/{id}/cancel
```

### Purchases
```
GET    /purchases                  (filter: search, status)
POST   /purchases
GET    /purchases/{id}
POST   /purchases/{id}/receive
```

### Inventory
```
GET    /inventory                  (filter: product_id, type)
POST   /inventory/in
POST   /inventory/out
POST   /inventory/adjust
```

### Debts
```
GET    /debts/customers            (filter: status, search)
POST   /debts/customers/{id}/pay
GET    /debts/suppliers            (filter: status, search)
POST   /debts/suppliers/{id}/pay
```

### Reports
```
GET    /reports/sales?period=month&from=&to=
GET    /reports/inventory
GET    /reports/profit-loss?period=month
GET    /reports/best-selling?limit=10
```

### Settings & Users
```
GET    /settings
POST   /settings
GET    /users               [role:owner]
POST   /users               [role:owner]
PUT    /users/{id}          [role:owner]
DELETE /users/{id}          [role:owner]
```

---

## 🗂 Struktur Project

### Backend (`backend/`)
```
app/
├── Http/Controllers/Api/     ← 11 API controllers
│   ├── AuthController.php
│   ├── DashboardController.php
│   ├── ProductController.php
│   ├── CategoryController.php
│   ├── SupplierController.php
│   ├── CustomerController.php
│   ├── SaleController.php
│   ├── PurchaseController.php
│   ├── InventoryController.php
│   ├── CustomerDebtController.php
│   ├── SupplierDebtController.php
│   ├── ReportController.php
│   ├── SettingController.php
│   └── UserController.php
├── Models/                   ← 15 Eloquent models
│   ├── User, Category, Supplier, Customer
│   ├── Product, Sale, SaleItem
│   ├── Purchase, PurchaseItem
│   ├── StockMovement
│   ├── CustomerDebt, CustomerDebtPayment
│   ├── SupplierDebt, SupplierDebtPayment
│   └── Setting
└── Services/                 ← Business logic
    ├── SaleService.php       (transaksi + stok otomatis)
    ├── InventoryService.php  (in/out/adjust)
    ├── PurchaseService.php   (PO + receive)
    ├── DebtService.php       (bayar hutang)
    └── ReportService.php     (laporan)

database/
├── migrations/               ← 25 migration files
└── seeders/
    ├── DatabaseSeeder.php
    ├── RolePermissionSeeder.php
    ├── UserSeeder.php
    ├── CategorySeeder.php
    ├── ProductSeeder.php     ← 10 produk demo
    └── SettingSeeder.php
```

### Frontend (`frontend/src/`)
```
api/
├── axios.ts                  ← Axios instance + interceptors
├── auth.ts                   ← Login/logout/me
├── products.ts               ← Products + barcode search
└── index.ts                  ← Semua endpoint lainnya

components/
├── layout/
│   ├── AppLayout.tsx         ← Layout utama
│   ├── Sidebar.tsx           ← Collapsible sidebar (desktop)
│   ├── Header.tsx            ← Breadcrumb + notif + avatar
│   ├── BottomNav.tsx         ← Floating dark pill nav (mobile)
│   └── MobileMenu.tsx        ← Sheet menu dari bawah (mobile)
└── ui/
    ├── BarcodeScanner.tsx    ← Kamera scanner @zxing
    ├── Modal.tsx             ← Bottom sheet mobile / centered desktop
    ├── StatCard.tsx          ← Gradient stat cards
    ├── Pagination.tsx
    ├── SearchBar.tsx         ← Debounced search + clear
    ├── ConfirmDialog.tsx
    ├── EmptyState.tsx
    └── Spinner.tsx

lib/
├── utils.ts                  ← Format currency, date, badge helpers
├── escpos.ts                 ← ESC/POS command builder (thermal print)
├── bluetoothPrinter.ts       ← Web Bluetooth API manager
└── browserPrint.ts           ← Print via browser popup window

store/
├── authStore.ts              ← Auth + token (persisted)
├── cartStore.ts              ← POS cart state
└── settingStore.ts           ← App settings cache

pages/
├── auth/LoginPage.tsx        ← Split layout + demo accounts
├── dashboard/DashboardPage.tsx
├── pos/
│   ├── PosPage.tsx           ← Full POS dengan mini cart bar mobile
│   └── ReceiptModal.tsx      ← Struk + BT print + browser print
├── products/
│   ├── ProductsPage.tsx
│   └── ProductFormPage.tsx   ← Dengan scan barcode + margin preview
├── categories/CategoriesPage.tsx
├── suppliers/SuppliersPage.tsx
├── customers/
│   ├── CustomersPage.tsx
│   └── CustomerDetail.tsx
├── sales/
│   ├── SalesPage.tsx
│   └── SaleDetail.tsx
├── purchases/
│   ├── PurchasesPage.tsx
│   ├── PurchaseForm.tsx
│   └── PurchaseDetail.tsx
├── inventory/InventoryPage.tsx
├── debts/
│   ├── CustomerDebts.tsx
│   └── SupplierDebts.tsx
├── reports/
│   ├── ReportSales.tsx
│   ├── ReportInventory.tsx
│   └── ReportPnL.tsx
├── users/UsersPage.tsx
└── settings/
    ├── SettingsPage.tsx
    └── PrinterSettingsPage.tsx
```

---

## 📋 Database Schema

| Tabel | Keterangan |
|-------|------------|
| users | Akun pengguna |
| roles / permissions | Spatie Permission (guard: web) |
| categories | Kategori produk (9 default) |
| suppliers | Data supplier |
| customers | Data pelanggan + limit hutang |
| products | Master produk + stok + foto |
| sales | Header transaksi penjualan |
| sale_items | Detail item penjualan |
| purchases | Purchase Order ke supplier |
| purchase_items | Detail item PO |
| stock_movements | Log semua pergerakan stok |
| customer_debts | Hutang pelanggan |
| customer_debt_payments | Riwayat bayar hutang pelanggan |
| supplier_debts | Hutang ke supplier |
| supplier_debt_payments | Riwayat bayar hutang supplier |
| settings | Konfigurasi app (store name, tax, dll) |

**Total: 16 tabel + 9 tabel sistem Laravel** (users, cache, jobs, sessions, dll)

---

## 🚢 Production Build

### Backend
```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/  (deploy ke web server)
```

### Nginx (VPS Ubuntu)
```nginx
# Backend API
server {
    listen 80;
    server_name api.warungbutik.com;
    root /var/www/Toko/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# Frontend SPA
server {
    listen 80;
    server_name warungbutik.com;
    root /var/www/Toko/frontend/dist;

    location / { try_files $uri $uri/ /index.html; }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment (.env penting)
```env
# Backend CORS — tambahkan URL frontend production
FRONTEND_URL=https://warungbutik.com
SANCTUM_STATEFUL_DOMAINS=warungbutik.com

# Storage
FILESYSTEM_DISK=public
```

---

## 🖨️ Printer Thermal Bluetooth

### Browser yang Support Web Bluetooth
| Browser | Platform | Status |
|---------|----------|--------|
| Chrome 89+ | Android | ✅ |
| Chrome 89+ | Windows/Mac | ✅ |
| Edge 79+ | Windows | ✅ |
| Firefox | Semua | ❌ |
| Safari | iOS/Mac | ❌ |

### Printer yang Kompatibel
- Epson TM-T20 / TM-T82
- Gprinter GP-58 / GP-80
- Xprinter XP-58 / XP-80
- Rongta RPP300 / RPP58
- HOIN HOP-H58
- Dan semua printer ESC/POS compatible

### Ukuran Kertas
- **58mm** → 32 karakter per baris
- **80mm** → 48 karakter per baris

Setting di `/settings/printer`

---

## 🗺 Roadmap

### v2.0
- [ ] Export PDF & Excel per laporan
- [ ] WhatsApp Notification (Fonnte / WABLAS)
- [ ] QRIS Dynamic (Midtrans / Xendit)
- [ ] Multi Store & Multi Warehouse
- [ ] PWA (Progressive Web App) — install ke homescreen
- [ ] Customer Loyalty Points

### v3.0
- [ ] Android App (React Native)
- [ ] AI Sales Prediction
- [ ] Membership System

---

## 📄 License

MIT © 2025 Warung Bu Tutik
