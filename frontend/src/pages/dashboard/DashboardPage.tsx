import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/api'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import {
  Package, ShoppingCart, TrendingUp, CreditCard,
  Wallet, AlertTriangle, BarChart2, DollarSign, Star,
} from 'lucide-react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Link } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend)

const chartOpts: any = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false }, tooltip: { cornerRadius: 12 } },
  scales: {
    y: {
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 5 },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      border: { display: false },
    },
  },
}

export default function DashboardPage() {
  const currency = useSettingStore((s) => s.currency())
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) return <Spinner />

  const { stats, daily_sales, monthly_revenue, best_selling, low_stock_products } = data

  const lineData = {
    labels: daily_sales.map((d: any) =>
      new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(new Date(d.date))
    ),
    datasets: [{
      label: 'Penjualan',
      data: daily_sales.map((d: any) => d.total),
      borderColor: '#16A34A',
      backgroundColor: 'rgba(22,163,74,.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#16A34A',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  }

  const barData = {
    labels: monthly_revenue.map((m: any) => m.month),
    datasets: [{
      label: 'Pendapatan',
      data: monthly_revenue.map((m: any) => m.total),
      backgroundColor: 'rgba(22,163,74,.85)',
      borderRadius: 10,
      borderSkipped: false,
    }],
  }

  const statCards = [
    { title: 'Total Produk',       value: formatNumber(stats.total_products),                    icon: <Package size={20}/>,       gradient: 'from-blue-500 to-indigo-600' },
    { title: 'Penjualan Hari Ini', value: formatCurrency(stats.sales_today, currency),           icon: <ShoppingCart size={20}/>,  gradient: 'from-emerald-500 to-green-600' },
    { title: 'Pendapatan Bulan',   value: formatCurrency(stats.revenue_this_month, currency),    icon: <TrendingUp size={20}/>,    gradient: 'from-emerald-500 to-teal-600' },
    { title: 'Total Stok',         value: formatNumber(stats.total_stock),                       icon: <BarChart2 size={20}/>,     gradient: 'from-violet-500 to-purple-700' },
    { title: 'Hutang Pelanggan',   value: formatCurrency(stats.customer_debt, currency),         icon: <CreditCard size={20}/>,    gradient: 'from-amber-400 to-orange-500' },
    { title: 'Hutang Supplier',    value: formatCurrency(stats.supplier_debt, currency),         icon: <Wallet size={20}/>,        gradient: 'from-rose-500 to-red-600' },
    { title: 'Penjualan Bulan',    value: formatCurrency(stats.sales_this_month, currency),      icon: <DollarSign size={20}/>,    gradient: 'from-cyan-500 to-blue-500' },
    { title: 'Stok Menipis',       value: formatNumber(stats.low_stock_count), subtitle: 'produk perlu diisi', icon: <AlertTriangle size={20}/>, gradient: 'from-amber-400 to-yellow-500' },
  ]

  return (
    <div className="space-y-3 md:space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {statCards.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── Charts — di mobile scroll horizontal kalau perlu, di desktop 2 kolom ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="card p-3 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm font-bold text-slate-700">Penjualan 7 Hari</p>
            <Link to="/reports/sales" className="text-xs text-primary-600 font-semibold hover:underline">
              Laporan →
            </Link>
          </div>
          <Line data={lineData} options={chartOpts} />
        </div>
        <div className="card p-3 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm font-bold text-slate-700">Pendapatan 6 Bulan</p>
            <Link to="/reports/profit-loss" className="text-xs text-primary-600 font-semibold hover:underline">
              Laba rugi →
            </Link>
          </div>
          <Bar data={barData} options={chartOpts} />
        </div>
      </div>

      {/* ── Best selling & Low stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">

        {/* Best selling */}
        <div className="card p-3 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star size={12} className="text-amber-500 fill-amber-500" />
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700">Produk Terlaris</p>
            </div>
            <Link to="/reports/sales" className="text-xs text-primary-600 font-semibold hover:underline">Semua →</Link>
          </div>

          {best_selling.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Belum ada data penjualan</p>
          ) : (
            <div className="space-y-2.5">
              {best_selling.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-slate-300 text-white' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{item.product?.name}</p>
                    <p className="text-[10px] text-slate-400">{formatNumber(item.total_qty)} terjual</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600 shrink-0">
                    {formatCurrency(item.total_revenue, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card p-3 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={12} className="text-amber-500" />
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700">Stok Hampir Habis</p>
            </div>
            <Link to="/inventory" className="text-xs text-primary-600 font-semibold hover:underline">Atur →</Link>
          </div>

          {low_stock_products.length === 0 ? (
            <div className="flex flex-col items-center py-4">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-xs font-semibold text-slate-600">Semua stok aman</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {low_stock_products.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 mr-2">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.category?.name}</p>
                  </div>
                  <span className={`badge shrink-0 text-[10px] ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.stock === 0 ? 'Habis' : `${p.stock} ${p.unit}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="card p-3 md:p-5">
        <p className="text-xs md:text-sm font-bold text-slate-700 mb-3">Aksi Cepat</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Kasir',   to: '/pos',              icon: <ShoppingCart size={18}/>, gradient: 'from-emerald-500 to-green-600' },
            { label: 'Produk',  to: '/products/create',  icon: <Package size={18}/>,      gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Buat PO', to: '/purchases/create', icon: <TrendingUp size={18}/>,   gradient: 'from-violet-500 to-purple-700' },
            { label: 'Laporan', to: '/reports/sales',    icon: <BarChart2 size={18}/>,    gradient: 'from-amber-400 to-orange-500' },
          ].map((a) => (
            <Link key={a.label} to={a.to}
              className="flex flex-col items-center gap-1.5 p-2 md:p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                {a.icon}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-slate-600">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
