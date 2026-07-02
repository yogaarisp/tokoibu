import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'Rp'): string {
  return `${currency} ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function saleStatusBadge(status: string) {
  return { paid: 'badge-green', debt: 'badge-yellow', cancelled: 'badge-red' }[status] ?? 'badge-gray'
}

export function debtStatusBadge(status: string) {
  return { unpaid: 'badge-red', partial: 'badge-yellow', paid: 'badge-green' }[status] ?? 'badge-gray'
}

export function purchaseStatusBadge(status: string) {
  return { pending: 'badge-yellow', received: 'badge-green', cancelled: 'badge-red' }[status] ?? 'badge-gray'
}

export function saleStatusLabel(status: string) {
  return { paid: 'Lunas', debt: 'Hutang', cancelled: 'Dibatalkan' }[status] ?? status
}

export function debtStatusLabel(status: string) {
  return { unpaid: 'Belum Bayar', partial: 'Sebagian', paid: 'Lunas' }[status] ?? status
}

export function purchaseStatusLabel(status: string) {
  return { pending: 'Menunggu', received: 'Diterima', cancelled: 'Dibatalkan' }[status] ?? status
}
