<?php

namespace App\Services;

use App\Models\CustomerDebt;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SupplierDebt;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function salesReport(string $period, ?string $from, ?string $to): array
    {
        [$start, $end] = $this->dateRange($period, $from, $to);

        $sales = Sale::where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [$start, $end])
            ->with('items')
            ->get();

        $totalSales = $sales->count();
        $totalRevenue = (float) $sales->sum('grand_total');
        $totalCogs = (float) $sales->flatMap(fn ($sale) => $sale->items)
            ->sum(fn ($i) => (float) $i->buy_price * $i->quantity);
        $grossProfit = $totalRevenue - $totalCogs;

        $daily = Sale::select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(grand_total) as revenue'), DB::raw('COUNT(*) as transactions'))
            ->where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return compact('totalSales', 'totalRevenue', 'totalCogs', 'grossProfit', 'daily');
    }

    public function inventoryReport(): array
    {
        // Sumber kebenaran stok: sum(product_stocks) — bukan mirror products.stock
        $products = Product::with(['category', 'productStocks'])->get();
        $products->each(function ($p) {
            $p->total_stock = (int) $p->productStocks->sum('stock');
        });

        $totalValue = (float) $products->sum(fn ($p) => $p->total_stock * (float) $p->buy_price);
        $lowStock = Product::lowStock()->with('category')->get();
        $outOfStock = Product::query()
            ->whereDoesntHave('productStocks', fn ($q) => $q->where('stock', '>', 0))
            ->count();

        return compact('products', 'totalValue', 'lowStock', 'outOfStock');
    }

    public function profitLossReport(string $period, ?string $from, ?string $to): array
    {
        [$start, $end] = $this->dateRange($period, $from, $to);

        $sales = Sale::where('status', '!=', 'cancelled')->whereBetween('created_at', [$start, $end])->with('items')->get();
        $revenue = (float) $sales->sum('grand_total');
        $cogs = (float) $sales->flatMap(fn ($sale) => $sale->items)
            ->sum(fn ($i) => (float) $i->buy_price * $i->quantity);
        $grossProfit = $revenue - $cogs;
        $customerDebt = (float) CustomerDebt::whereIn('status', ['unpaid', 'partial'])->sum('remaining_amount');
        $supplierDebt = (float) SupplierDebt::whereIn('status', ['unpaid', 'partial'])->sum('remaining_amount');

        return compact('revenue', 'cogs', 'grossProfit', 'customerDebt', 'supplierDebt');
    }

    public function bestSelling(int $limit = 10, ?string $from = null, ?string $to = null): array
    {
        return SaleItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->when($from && $to, fn ($q) => $q->whereBetween('created_at', [$from, $to]))
            ->with('product:id,name,sku')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function dateRange(string $period, ?string $from, ?string $to): array
    {
        return match ($period) {
            'today' => [Carbon::today(),                    Carbon::today()->endOfDay()],
            'week' => [Carbon::now()->startOfWeek(),       Carbon::now()->endOfWeek()],
            'month' => [Carbon::now()->startOfMonth(),      Carbon::now()->endOfMonth()],
            'year' => [Carbon::now()->startOfYear(),       Carbon::now()->endOfYear()],
            'custom' => [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()],
            default => [Carbon::now()->startOfMonth(),      Carbon::now()->endOfMonth()],
        };
    }
}
