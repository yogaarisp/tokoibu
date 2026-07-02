import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { getSettings } from '@/api'
import { useSettingStore } from '@/store/settingStore'

export default function AppLayout() {
  const setSettings = useSettingStore((s) => s.setSettings)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    getSettings().then((r) => setSettings(r.data)).catch(() => {})
  }, [setSettings])

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 lg:z-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-28 lg:pb-5">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <BottomNav />
    </div>
  )
}
