import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSalesReport } from '@/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import { TrendingUp, ShoppingCart, DollarSign, BarChart2 } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

export default function ReportSales() {
  const currency = useSettingStore((s) => s.currency())
  const [period, setPeriod] = useState<Period>('month')
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', period, from, to],
    queryFn: () => getSalesReport({ period, from: from || undefined, to: to || undefined }).then(r => r.data),
  })

  const chartData = {
    labels: data?.daily.map((d: any) => d.date) ?? [],
    datasets: [{
      label: 'Pendapatan',
      data: data?.daily.map((d: any) => d.revenue) ?? [],
      backgroundColor: '#16A34A',
      borderRadius: 8,
    }],
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'week',  label: 'Minggu Ini' },
    { key: 'month', label: 'Bulan Ini' },
    { key: 'year',  label: 'Tahun Ini' },
    { key: 'custom',label: 'Kustom' },
  ]

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${period === p.key ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" className="input w-40 text-sm" value={from} onChange={e => setFrom(e.target.value)} />
            <span className="text-slate-400">—</span>
            <input type="date" className="input w-40 text-sm" value={to}   onChange={e => setTo(e.target.value)} />
          </>
        )}
      </div>

      {isLoading ? <Spinner /> : data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Transaksi" value={formatNumber(data.totalSales)}                        icon={<ShoppingCart size={20}/>} gradient="from-blue-500 to-indigo-600"   />
            <StatCard title="Total Pendapatan" value={formatCurrency(data.totalRevenue, currency)}         icon={<TrendingUp size={20}/>}   gradient="from-emerald-500 to-green-600"  />
            <StatCard title="HPP"              value={formatCurrency(data.totalCogs, currency)}            icon={<BarChart2 size={20}/>}    gradient="from-amber-400 to-orange-500"  />
            <StatCard title="Laba Kotor"       value={formatCurrency(data.grossProfit, currency)}          icon={<DollarSign size={20}/>}   gradient="from-violet-500 to-purple-700" />
          </div>

          {/* Chart */}
          <div className="card">
            <p className="text-sm font-semibold text-slate-700 mb-4">Pendapatan Harian</p>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          {/* Table */}
          <div className="card p-0">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead><tr><th>Tanggal</th><th>Transaksi</th><th>Pendapatan</th></tr></thead>
                <tbody>
                  {data.daily.map((d: any) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{formatNumber(d.transactions)}</td>
                      <td className="font-semibold">{formatCurrency(d.revenue, currency)}</td>
                    </tr>
                  ))}
                  {data.daily.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400">Tidak ada data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
