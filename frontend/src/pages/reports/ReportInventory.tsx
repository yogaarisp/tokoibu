import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInventoryReport } from '@/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import StatCard from '@/components/ui/StatCard'
import SearchBar from '@/components/ui/SearchBar'
import Spinner from '@/components/ui/Spinner'
import { Package, AlertTriangle, DollarSign, XCircle } from 'lucide-react'

export default function ReportInventory() {
  const currency = useSettingStore((s) => s.currency())
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => getInventoryReport().then(r => r.data),
  })

  const filtered = data?.products?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-5">
      {isLoading ? <Spinner /> : data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Produk"    value={formatNumber(data.products?.length ?? 0)}             icon={<Package size={20}/>}       gradient="from-blue-500 to-indigo-600"   />
            <StatCard title="Nilai Inventori" value={formatCurrency(data.totalValue, currency)}            icon={<DollarSign size={20}/>}    gradient="from-emerald-500 to-green-600"  />
            <StatCard title="Stok Menipis"    value={formatNumber(data.lowStock?.length ?? 0)}             icon={<AlertTriangle size={20}/>} gradient="from-amber-400 to-orange-500"  />
            <StatCard title="Stok Habis"      value={formatNumber(data.outOfStock ?? 0)} subtitle="produk" icon={<XCircle size={20}/>}       gradient="from-rose-500 to-red-600"      />
          </div>

          {/* Low stock alert */}
          {data.lowStock?.length > 0 && (
            <div className="card border border-yellow-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-800">{data.lowStock.length} Produk Stok Menipis</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {data.lowStock.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-xl p-2.5 border border-yellow-100">
                    <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.category?.name}</p>
                    <p className={`text-sm font-bold mt-1 ${p.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {p.stock} {p.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All products table */}
          <div className="card p-0">
            <div className="p-4 border-b border-slate-100">
              <SearchBar value={search} onChange={setSearch} placeholder="Cari produk..." />
            </div>
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead>
                  <tr><th>Produk</th><th>SKU</th><th>Kategori</th><th>Stok</th><th>Min. Stok</th><th>Harga Beli</th><th>Nilai Stok</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td><span className="font-mono text-xs">{p.sku}</span></td>
                      <td><span className="badge badge-blue text-xs">{p.category?.name}</span></td>
                      <td className="font-semibold">{formatNumber(p.stock)} {p.unit}</td>
                      <td className="text-slate-500">{p.min_stock}</td>
                      <td>{formatCurrency(p.buy_price, currency)}</td>
                      <td className="font-semibold">{formatCurrency(p.stock * p.buy_price, currency)}</td>
                      <td>
                        <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= p.min_stock ? 'badge-yellow' : 'badge-green'}`}>
                          {p.stock === 0 ? 'Habis' : p.stock <= p.min_stock ? 'Menipis' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">Tidak ada data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
