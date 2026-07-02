<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerDebt;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SupplierDebt;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function index(): JsonResponse
    {
        $today     = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        $stats = [
            'total_products'     => Product::active()->count(),
            'total_stock'        => Product::active()->sum('stock'),
            'sales_today'        => Sale::whereDate('created_at', $today)->where('status', '!=', 'cancelled')->sum('grand_total'),
            'sales_this_month'   => Sale::where('created_at', '>=', $thisMonth)->where('status', '!=', 'cancelled')->sum('grand_total'),
            'revenue_this_month' => Sale::where('created_at', '>=', $thisMonth)->where('status', '!=', 'cancelled')->sum('grand_total'),
            'customer_debt'      => CustomerDebt::whereIn('status', ['unpaid', 'partial'])->sum('remaining_amount'),
            'supplier_debt'      => SupplierDebt::whereIn('status', ['unpaid', 'partial'])->sum('remaining_amount'),
            'low_stock_count'    => Product::lowStock()->count(),
        ];

        $daily_sales = Sale::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as total')
            )
            ->where('status', '!=', 'cancelled')
            ->where('created_at', '>=', Carbon::now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $monthly_revenue = Sale::select(
                DB::raw("DATE_FORMAT(created_at,'%Y-%m') as month"),
                DB::raw('SUM(grand_total) as total')
            )
            ->where('status', '!=', 'cancelled')
            ->where('created_at', '>=', Carbon::now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $best_selling = $this->reportService->bestSelling(5);

        $low_stock_products = Product::with('category:id,name')
            ->lowStock()
            ->active()
            ->orderBy('stock')
            ->limit(10)
            ->get(['id', 'name', 'stock', 'min_stock', 'unit', 'category_id']);

        return response()->json(compact(
            'stats', 'daily_sales', 'monthly_revenue',
            'best_selling', 'low_stock_products'
        ));
    }
}
