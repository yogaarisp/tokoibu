WARUNG BU TUTIK
Product Requirement Document (PRD)
Version 1.0
PROJECT OVERVIEW
Project Name

Warung Bu Tutik

Tagline

Belanja Mudah, Cepat dan Lengkap

Project Goal

Membangun aplikasi POS (Point of Sale), Inventory Management, Customer Management, dan Reporting System untuk warung sembako, warung madura, toko kelontong, dan minimarket skala kecil hingga menengah.

Sistem harus:

Cepat
Responsive
Mudah digunakan
Mobile Friendly
Siap Production
Multi User
Scalable
TECH STACK
Laravel 12
React 19
Inertia.js
Vite
Tailwind CSS
Shadcn UI
TanStack Table
Chart.js
Spatie Permission
ChartJS
DataTables
SweetAlert2
Font Awesome
Authentication
Laravel Breeze
Authorization
Spatie Laravel Permission
USER ROLES
Owner

Hak akses penuh.

Permissions
Dashboard
Produk
Kategori
Supplier
Pelanggan
Kasir
Laporan
Hutang
Pengaturan
User Management
Admin

Mengelola operasional toko.

Permissions
Dashboard
Produk
Supplier
Pelanggan
Transaksi
Laporan
Kasir

Melayani transaksi.

Permissions
POS
Produk
Pelanggan
Riwayat Transaksi
MODULES
Dashboard
Statistics
Total Produk
Total Stok
Penjualan Hari Ini
Penjualan Bulan Ini
Pendapatan Bulan Ini
Hutang Pelanggan
Hutang Supplier
Charts
Daily Sales
Monthly Revenue
Best Selling Product
Category Distribution
Product Management
Features
CRUD Produk
Search Produk
Filter Kategori
Import Excel
Export Excel
Barcode Generator
QR Code Generator
Fields
SKU
Barcode
Nama Produk
Kategori
Supplier
Harga Beli
Harga Jual
Stok
Minimal Stok
Foto Produk
Deskripsi
Status
Category Management
Features

CRUD Lengkap

Default Categories
Sembako
Makanan
Minuman
Rokok
LPG
Frozen Food
Household
Supplier Management
Fields
Nama Supplier
Nomor HP
Email
Alamat
Catatan
Features

CRUD Lengkap

Customer Management
Fields
Nama
Nomor HP
Alamat
Limit Hutang
Catatan
Features
Riwayat Pembelian
Riwayat Hutang
Riwayat Pembayaran
POS (Point Of Sale)
Features
Scan Barcode
Search Produk
Shopping Cart
Multi Quantity
Diskon
Pajak
Cash Payment
QRIS Payment
Transfer Bank
Hutang Pelanggan
Output
Thermal Receipt 58mm
Thermal Receipt 80mm
PDF Receipt
Inventory Management
Features
Stock In
Stock Out
Stock Adjustment
Stock Opname
Tracking
Riwayat Perubahan Stok
User Tracking
Timestamp Tracking
Purchase Order
Features
Create PO
Receive Goods
Supplier Tracking
Auto Process

Saat barang diterima:

Tambah Stok Otomatis
Simpan Harga Beli
Customer Debt Management
Features
Tambah Hutang
Bayar Cicilan
Riwayat Pembayaran
Reminder Jatuh Tempo
Supplier Debt Management
Features
Catat Hutang
Bayar Hutang
Riwayat Pembayaran
Reporting
Sales Reports
Harian
Mingguan
Bulanan
Tahunan
Inventory Reports
Stok Barang
Barang Hampir Habis
Barang Terlaris
Financial Reports
Laba Rugi
Hutang Pelanggan
Hutang Supplier
Export
PDF
Excel
Print
UI/UX REQUIREMENTS
Design Style

Modern SaaS Dashboard

Inspired by:

Shopify Admin
Tokopedia Seller Center
Moka POS
Pawoon POS
Color Palette

Primary

#16A34A

Secondary

#15803D

Background

#F8FAFC

Text

#1E293B

Danger

#DC2626

Warning

#F59E0B

Success

#22C55E

UI Components
Modern Cards
Soft Shadow
Rounded Corner 16px
Responsive Tables
Toast Notification
Dark Mode
Light Mode
DATABASE DESIGN
Main Tables

users

roles

permissions

products

categories

suppliers

customers

sales

sale_items

purchases

purchase_items

stock_movements

customer_debts

customer_debt_payments

supplier_debts

supplier_debt_payments

settings

activity_logs

notifications

RELATIONSHIP

Category

1 -> Many Products

Supplier

1 -> Many Products

Customer

1 -> Many Sales

Sale

1 -> Many Sale Items

Purchase

1 -> Many Purchase Items

Product

1 -> Many Stock Movements

Customer Debt

1 -> Many Debt Payments

Supplier Debt

1 -> Many Debt Payments

FOLDER STRUCTURE

app/

├── Http/

├── Models/

├── Repositories/

├── Services/

├── Policies/

├── Helpers/

├── Traits/

│

database/

├── migrations/

├── seeders/

├── factories/

│

resources/

├── views/

│ ├── dashboard/

│ ├── products/

│ ├── categories/

│ ├── suppliers/

│ ├── customers/

│ ├── pos/

│ ├── reports/

│ ├── settings/

│

routes/

├── web.php

├── api.php

SERVICE LAYER
ProductService
create()
update()
delete()
import()
export()
SaleService
createTransaction()
generateReceipt()
calculateDiscount()
InventoryService
stockIn()
stockOut()
stockAdjustment()
ReportService
salesReport()
inventoryReport()
profitLossReport()
SECURITY

Implement:

CSRF Protection
XSS Protection
SQL Injection Protection
Validation Layer
Permission Middleware
Role Middleware
Audit Logging
NOTIFICATIONS

Show notification when:

Stok menipis
Hutang jatuh tempo
Barang masuk
Barang keluar
Penjualan berhasil

Use Bootstrap Toast.

DEPLOYMENT

Support:

Shared Hosting
VPS Ubuntu
Docker
FUTURE ROADMAP

Version 2

WhatsApp Notification
QRIS Dynamic
Multi Store
Multi Warehouse
Android App
PWA
Customer Loyalty Points
Membership System
AI Sales Prediction
OUTPUT REQUIREMENT FOR AI

Generate project in this order:

Database Schema
ERD
Migration Files
Models
Repositories
Services
Controllers
Routes
Blade Templates
Middleware
Seeders
Test Cases
Deployment Guide

Generate production-ready code only.

Do not skip files.

Follow Laravel Best Practices.