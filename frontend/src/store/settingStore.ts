import { create } from 'zustand'
import { Setting } from '@/types'

interface SettingState {
  settings: Setting
  setSettings: (s: Setting) => void
  currency: () => string
  taxRate: () => number
  storeName: () => string
}

export const useSettingStore = create<SettingState>((set, get) => ({
  settings: { currency: 'Rp', tax_rate: '0', store_name: 'Warung Bu Tutik', receipt_note: '' },
  setSettings: (s) => set({ settings: s }),
  currency: () => get().settings['currency'] ?? 'Rp',
  taxRate:  () => Number(get().settings['tax_rate'] ?? 0),
  storeName: () => get().settings['store_name'] ?? 'Warung Bu Tutik',
}))
