import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, ArrowRight } from 'lucide-react'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('owner@warungbutik.com')
  const [password, setPassword] = useState('password')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login(email, password)
      setAuth(data.user, data.token)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel (branding) — hidden on small mobile ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-green-800 relative overflow-hidden items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 text-white max-w-sm">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 border border-white/20">
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Warung<br />Bu Tutik
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed mb-8">
            Belanja Mudah, Cepat dan Lengkap
          </p>
          <div className="space-y-3">
            {['POS Kasir Cepat', 'Manajemen Stok Mudah', 'Laporan Lengkap', 'Multi User'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-primary-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[#F0F4F8]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
            <ShoppingBag size={24} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Warung Bu Tutik</p>
            <p className="text-xs text-slate-400">Belanja Mudah, Cepat dan Lengkap</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Selamat datang 👋</h2>
            <p className="text-slate-500 mt-1">Masuk untuk melanjutkan ke sistem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@warungbutik.com"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-8 h-8"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Masuk
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Demo Akun</p>
            <div className="space-y-2">
              {[
                { role: 'Owner',  email: 'owner@warungbutik.com',  color: 'bg-red-100 text-red-700' },
                { role: 'Admin',  email: 'admin@warungbutik.com',  color: 'bg-blue-100 text-blue-700' },
                { role: 'Kasir', email: 'kasir@warungbutik.com',  color: 'bg-green-100 text-green-700' },
              ].map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword('password') }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${acc.color}`}>
                    {acc.role}
                  </span>
                  <span className="text-xs text-slate-500 truncate group-hover:text-slate-700 transition-colors">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} Warung Bu Tutik POS System
        </p>
      </div>
    </div>
  )
}
