import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api'
import { Supplier } from '@/types'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const empty = { name: '', phone: '', email: '', address: '', notes: '', is_active: true }

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [edit, setEdit]     = useState<Supplier | null>(null)
  const [del, setDel]       = useState<number | null>(null)
  const [form, setForm]     = useState(empty)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => getSuppliers({ page, search, per_page: 20 }).then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d: typeof form) => edit ? updateSupplier(edit.id, d) : createSupplier(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Disimpan.')
      setModal(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const delMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Dihapus.')
      setDel(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const openCreate = () => { setEdit(null); setForm(empty); setModal(true) }
  const openEdit   = (s: Supplier) => {
    setEdit(s)
    setForm({ name: s.name, phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', notes: s.notes ?? '', is_active: s.is_active })
    setModal(true)
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Cari supplier..."
          className="flex-1 min-w-[180px]"
        />
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Supplier</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {/* ── Desktop table ── */}
          <div className="card p-0 hidden md:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Nama</th><th>No. HP</th><th>Email</th>
                    <th>Produk</th><th>Status</th><th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold">{s.name}</td>
                      <td className="text-slate-500">{s.phone ?? '-'}</td>
                      <td className="text-slate-500">{s.email ?? '-'}</td>
                      <td><span className="badge badge-blue">{s.products_count ?? 0} produk</span></td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(s)} className="btn-icon">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDel(s.id)}
                            className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && (
              <EmptyState
                title="Belum ada supplier"
                description="Tambah supplier untuk mulai melakukan pembelian"
                action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Tambah Supplier</button>}
              />
            )}
            {data && (
              <div className="p-4 border-t border-slate-50">
                <Pagination data={data} onPageChange={setPage} />
              </div>
            )}
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-2">
            {data?.data.length === 0 && (
              <EmptyState title="Belum ada supplier"
                action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> Tambah</button>} />
            )}
            {data?.data.map((s: Supplier) => (
              <div key={s.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-amber-200 rounded-xl flex items-center justify-center font-bold text-orange-700 text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate leading-tight">{s.name}</p>
                      <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`} style={{fontSize:'10px',padding:'1px 6px'}}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(s)} className="btn-icon w-7 h-7"><Edit2 size={13} /></button>
                    <button onClick={() => setDel(s.id)} className="btn-icon w-7 h-7 text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                  </div>
                </div>
                {(s.phone || s.email) && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone size={11} className="text-slate-400 shrink-0" /><span>{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Mail size={11} className="text-slate-400 shrink-0" /><span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Produk</span>
                  <span className="badge badge-blue" style={{fontSize:'10px',padding:'1px 6px'}}>{s.products_count ?? 0}</span>
                </div>
              </div>
            ))}
            {data && <Pagination data={data} onPageChange={setPage} />}
          </div>
        </>
      )}

      {/* ── Modal Form ── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={edit ? 'Edit Supplier' : 'Tambah Supplier'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nama supplier"
              required
            />
          </div>

          <div>
            <label className="label">No. HP</label>
            <input
              type="tel"
              className="input"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="supplier@email.com"
            />
          </div>

          <div>
            <label className="label">Alamat</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Alamat lengkap supplier"
            />
          </div>

          <div>
            <label className="label">Catatan</label>
            <input
              className="input"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Opsional..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="rounded w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">Supplier Aktif</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">
              Batal
            </button>
            <button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending}
              className="btn-primary flex-1"
            >
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={!!del}
        message="Supplier ini akan dihapus. Data terkait tidak ikut terhapus. Yakin?"
        onConfirm={() => del && delMut.mutate(del)}
        onCancel={() => setDel(null)}
        loading={delMut.isPending}
      />
    </div>
  )
}
