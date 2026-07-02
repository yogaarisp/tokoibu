import { Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Cari...', className = '' }: Props) {
  const [local, setLocal] = useState(value)

  useEffect(() => { setLocal(value) }, [value])

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 400)
    return () => clearTimeout(t)
  }, [local, onChange])

  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        className="input pl-10 pr-9"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
      />
      {local && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => { setLocal(''); onChange('') }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
