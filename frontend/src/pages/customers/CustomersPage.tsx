import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Eye, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api'
import { Customer } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useSettingStore } from '@/store/settingStore'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const empty = { name: '', phone: '', address: '', debt_limit: '0', notes: '', is_active: true }

export default function CustomersPage() {
  const qc       = useQueryClient()
  const currency = useSettingStore((s) => s.currency())
  const [page, setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit]   = useState<Customer | null>(null)
  const [del, setDel]     = useState<number | null>(null)
  const [form, setForm]   = useState(empty)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => getCustomers({ page, search, per_page: 20 }).then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d: typeof form) => edit ? updateCustomer(edit.id, d) : createCustomer(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Disimpan.'); setModal(false) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const delMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Dihapus.'); setDel(null) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const openCreate = () => { setEdit(null); setForm(empty); setModal(true) }
  const openEdit   = (c: Customer) => {
    setEdit(c)
    setForm({ name: c.name, phone: c.phone ?? '', address: c.address ?? '', debt_limit: String(c.debt_limit), notes: c.notes ?? '', is_active: c.is_active })
    setModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari pelanggan..." className="flex-1 min-w-[180px]" />
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /><span className="hidden sm:inline">Tambah Pelanggan</span><span className="sm:hidden">Tambah</span></button>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {/* Desktop */}
          <div className="card p-0 hidden md:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead><tr><th>Nama</th><th>No. HP</th><th>Limit Hutang</th><th>Hutang Saat Ini</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {data?.data.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td className="text-slate-500">{c.phone ?? '-'}</td>
                      <td>{formatCurrency(c.debt_limit, currency)}</td>
                      <td>
                        <span className={`badge ${c.current_debt > 0 ? 'badge-yellow' : 'badge-green'}`}>
                          {c.current_debt > 0 && <TrendingDown size={11} />}
                          {formatCurrency(c.current_debt, currency)}
                        </span>
                      </td>
                      <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <Link to={`/customers/${c.id}`} className="btn-icon"><Eye size={15} /></Link>
                          <button onClick={() => openEdit(c)} className="btn-icon"><Edit2 size={15} /></button>
                          <button onClick={() => setDel(c.id)} className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && <EmptyState title="Belum ada pelanggan" />}
            {data && <div className="p-4"><Pagination data={data} onPageChange={setPage} /></div>}
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {data?.data.length === 0 && <EmptyState title="Belum ada pelanggan" />}
            {data?.data.map((c: Customer) => (
              <div key={c.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate leading-tight">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.phone ?? 'Tidak ada HP'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link to={`/customers/${c.id}`} className="btn-icon w-7 h-7"><Eye size={13} /></Link>
                    <button onClick={() => openEdit(c)} className="btn-icon w-7 h-7"><Edit2 size={13} /></button>
                    <button onClick={() => setDel(c.id)} className="btn-icon w-7 h-7 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </div>
                {c.current_debt > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Hutang aktif</span>
                    <span className="badge badge-yellow" style={{fontSize:'10px',padding:'1px 6px'}}>{formatCurrency(c.current_debt, currency)}</span>
                  </div>
                )}
              </div>
            ))}
            {data && <Pagination data={data} onPageChange={setPage} />}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? 'Edit Pelanggan' : 'Tambah Pelanggan'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nama *</label><input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
          <div><label className="label">No. HP</label><input type="tel" className="input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
          <div><label className="label">Limit Hutang</label><input type="number" className="input" min="0" value={form.debt_limit} onChange={e => setForm(f => ({...f, debt_limit: e.target.value}))} /></div>
          <div><label className="label">Alamat</label><textarea className="input resize-none" rows={2} value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Batal</button>
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="btn-primary flex-1">
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} message="Pelanggan akan dihapus. Yakin?" onConfirm={() => del && delMut.mutate(del)} onCancel={() => setDel(null)} loading={delMut.isPending} />
    </div>
  )
}
