<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService) {}

    public function sales(Request $request): JsonResponse
    {
        $data = $this->reportService->salesReport(
            $request->get('period', 'month'),
            $request->get('from'),
            $request->get('to')
        );

        return response()->json($data);
    }

    public function inventory(): JsonResponse
    {
        return response()->json($this->reportService->inventoryReport());
    }

    public function profitLoss(Request $request): JsonResponse
    {
        $data = $this->reportService->profitLossReport(
            $request->get('period', 'month'),
            $request->get('from'),
            $request->get('to')
        );

        return response()->json($data);
    }

    public function bestSelling(Request $request): JsonResponse
    {
        $data = $this->reportService->bestSelling(
            $request->get('limit', 10),
            $request->get('from'),
            $request->get('to')
        );

        return response()->json($data);
    }
}
