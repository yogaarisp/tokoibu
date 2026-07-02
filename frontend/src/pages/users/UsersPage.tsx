import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUser, deleteUser } from '@/api'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import SearchBar from '@/components/ui/SearchBar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'

const emptyForm = { name: '', email: '', password: '', password_confirmation: '', role: '' }
const roleCls: Record<string, string> = { owner: 'badge-red', admin: 'badge-blue', kasir: 'badge-green' }

export default function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit]   = useState<any>(null)
  const [del, setDel]     = useState<number | null>(null)
  const [form, setForm]   = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => getUsers({ page, search, per_page: 20 }).then(r => r.data),
  })

  const saveMut = useMutation({
    mutationFn: (d: typeof form) => edit ? updateUser(edit.id, d) : createUser(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Disimpan.')
      setModal(false)
      setErrors({})
    },
    onError: (e: any) => {
      if (e.response?.data?.errors) setErrors(e.response.data.errors)
      else toast.error(e.response?.data?.message ?? 'Gagal.')
    },
  })

  const delMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Dihapus.'); setDel(null) },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Gagal.'),
  })

  const openCreate = () => { setEdit(null); setForm(emptyForm); setErrors({}); setModal(true) }
  const openEdit   = (u: any) => {
    setEdit(u)
    setForm({ name: u.name, email: u.email, password: '', password_confirmation: '', role: u.roles?.[0]?.name ?? '' })
    setErrors({})
    setModal(true)
  }

  const users = data?.users ?? data
  const roles = data?.roles ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Cari user..." />
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Tambah User</button>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="card p-0">
          <div className="tbl-wrapper">
            <table className="tbl">
              <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Aksi</th></tr></thead>
              <tbody>
                {(users?.data ?? []).map((u: any) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-slate-500 text-xs">{u.email}</td>
                    <td>
                      {u.roles?.map((r: any) => (
                        <span key={r.id} className={`badge ${roleCls[r.name] ?? 'badge-gray'} capitalize mr-1`}>{r.name}</span>
                      ))}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="btn-ghost p-1.5"><Edit2 size={15} /></button>
                        <button onClick={() => setDel(u.id)} className="btn-ghost p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(users?.data ?? []).length === 0 && <tr><td colSpan={4} className="text-center py-12 text-slate-400">Tidak ada user</td></tr>}
              </tbody>
            </table>
          </div>
          {users && <div className="p-4"><Pagination data={users} onPageChange={setPage} /></div>}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? 'Edit User' : 'Tambah User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nama *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="label">{edit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Konfirmasi Password</label>
            <input type="password" className="input" value={form.password_confirmation} onChange={e => setForm(f => ({...f, password_confirmation: e.target.value}))} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
              <option value="">Pilih role</option>
              {roles.map((r: any) => <option key={r.id} value={r.name} className="capitalize">{r.name}</option>)}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="btn-primary">
              {saveMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del} message="User ini akan dihapus. Yakin?"
        onConfirm={() => del && delMut.mutate(del)}
        onCancel={() => setDel(null)} loading={delMut.isPending}
      />
    </div>
  )
}
