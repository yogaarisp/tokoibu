import { PaginatedResponse } from '@/types'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props<T> {
  data: PaginatedResponse<T>
  onPageChange: (page: number) => void
}

export default function Pagination<T>({ data, onPageChange }: Props<T>) {
  if (data.last_page <= 1) return null

  const pages = Array.from({ length: data.last_page }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === data.last_page || Math.abs(p - data.current_page) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-slate-400 font-medium order-2 sm:order-1">
        {data.from}–{data.to} dari <span className="font-semibold text-slate-600">{data.total}</span> data
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(data.current_page - 1)}
          disabled={data.current_page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`d${i}`} className="w-8 text-center text-slate-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'w-8 h-8 rounded-xl text-sm font-semibold transition-all duration-200',
                data.current_page === p
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(data.current_page + 1)}
          disabled={data.current_page === data.last_page}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
