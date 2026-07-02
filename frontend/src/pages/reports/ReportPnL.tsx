import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfitLossReport } from '@/api'
import { formatCurrency } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Spinner from '@/components/ui/Spinner'
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

export default function ReportPnL() {
  const currency = useSettingStore((s) => s.currency())
  const [period, setPeriod] = useState<Period>('month')
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-pnl', period, from, to],
    queryFn: () => getProfitLossReport({ period, from: from || undefined, to: to || undefined }).then(r => r.data),
  })

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'week',  label: 'Minggu Ini' },
    { key: 'month', label: 'Bulan Ini' },
    { key: 'year',  label: 'Tahun Ini' },
    { key: 'custom', label: 'Kustom' },
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
          {/* P&L Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Income Statement */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-primary-600" /> Laporan Laba Rugi
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Pendapatan Penjualan</span>
                  <span className="font-semibold text-green-600">{formatCurrency(data.revenue, currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Harga Pokok Penjualan (HPP)</span>
                  <span className="font-semibold text-red-500">- {formatCurrency(data.cogs, currency)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-primary-50 rounded-xl px-3 mt-2">
                  <span className="text-sm font-bold text-slate-700">Laba Kotor</span>
                  <span className={`text-lg font-bold ${data.grossProfit >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                    {formatCurrency(data.grossProfit, currency)}
                  </span>
                </div>
              </div>

              {/* Profit margin */}
              {data.revenue > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Margin Laba Kotor</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, (data.grossProfit / data.revenue) * 100))}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-primary-600">
                      {((data.grossProfit / data.revenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Debt Summary */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-yellow-500" /> Ringkasan Hutang
              </h3>
              <div className="space-y-4">
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-red-500" />
                    <p className="text-xs font-medium text-red-700">Hutang Pelanggan (Piutang)</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(data.customerDebt, currency)}</p>
                  <p className="text-xs text-red-400 mt-0.5">Total piutang yang belum lunas</p>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-yellow-600" />
                    <p className="text-xs font-medium text-yellow-700">Hutang ke Supplier</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(data.supplierDebt, currency)}</p>
                  <p className="text-xs text-yellow-500 mt-0.5">Total hutang yang belum dilunasi</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-600">Posisi Bersih</p>
                    <span className={`text-sm font-bold ${data.customerDebt - data.supplierDebt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(data.customerDebt - data.supplierDebt), currency)}
                      {data.customerDebt - data.supplierDebt >= 0 ? ' (Untung)' : ' (Rugi)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="card">
            <p className="text-sm font-semibold text-slate-700 mb-4">Perbandingan Pendapatan vs HPP</p>
            <div className="space-y-3">
              {[
                { label: 'Pendapatan', value: data.revenue, color: 'bg-primary-500' },
                { label: 'HPP', value: data.cogs, color: 'bg-red-400' },
                { label: 'Laba Kotor', value: Math.max(0, data.grossProfit), color: 'bg-green-400' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: data.revenue > 0 ? `${Math.min(100, (item.value / data.revenue) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
