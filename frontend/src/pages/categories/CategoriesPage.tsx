import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api'
import { Category } from '@/types'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const empty = { name: '', icon: '', description: '', is_active: true }

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [edit, setEdit]     = useState<Category | null>(null)
  const [del, setDel]       = useState<number | null>(null)
  const [form, setForm]     = useState(empty)

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => getCategories({ page, search, per_page: 20 }).then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d: typeof form) => edit ? updateCategory(edit.id, d) : createCategory(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Disimpan.'); setModal(false) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const delMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Dihapus.'); setDel(null) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const openCreate = () => { setEdit(null); setForm(empty); setModal(true) }
  const openEdit   = (c: Category) => { setEdit(c); setForm({ name: c.name, icon: c.icon ?? '', description: c.description ?? '', is_active: c.is_active }); setModal(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari kategori..." className="flex-1 min-w-[180px]" />
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /><span className="hidden sm:inline">Tambah Kategori</span><span className="sm:hidden">Tambah</span></button>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {/* Desktop */}
          <div className="card p-0 hidden sm:block">
            <div className="tbl-wrapper">
              <table className="tbl">
                <thead><tr><th>Nama</th><th>Icon</th><th>Produk</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                <tbody>
                  {data?.data.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-lg">{c.icon || '-'}</span></td>
                      <td><span className="badge badge-blue">{c.products_count ?? 0} produk</span></td>
                      <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(c)} className="btn-icon"><Edit2 size={15} /></button>
                          <button onClick={() => setDel(c.id)} className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.data.length === 0 && <EmptyState title="Belum ada kategori" />}
            {data && <div className="p-4"><Pagination data={data} onPageChange={setPage} /></div>}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden grid grid-cols-2 gap-2">
            {data?.data.length === 0 && <div className="col-span-2"><EmptyState title="Belum ada kategori" /></div>}
            {data?.data.map((c) => (
              <div key={c.id} className="card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(c)} className="btn-icon w-6 h-6"><Edit2 size={12} /></button>
                    <button onClick={() => setDel(c.id)} className="btn-icon w-6 h-6 hover:text-red-600"><Trash2 size={12} /></button>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.products_count ?? 0} produk</p>
                <span className={`badge mt-1.5 ${c.is_active ? 'badge-green' : 'badge-gray'}`} style={{fontSize:'10px',padding:'1px 6px'}}>
                  {c.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? 'Edit Kategori' : 'Tambah Kategori'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nama *</label><input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
          <div><label className="label">Icon (Lucide name)</label><input className="input" value={form.icon} onChange={e => setForm(f => ({...f, icon: e.target.value}))} placeholder="ShoppingBasket" /></div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="rounded w-4 h-4" />
            <span className="text-sm font-medium text-slate-700">Kategori Aktif</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Batal</button>
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="btn-primary flex-1">
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} message="Kategori ini akan dihapus. Yakin?" onConfirm={() => del && delMut.mutate(del)} onCancel={() => setDel(null)} loading={delMut.isPending} />
    </div>
  )
}
