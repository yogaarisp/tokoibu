import { cn } from '@/lib/utils'

export default function Spinner({ 
  className, 
  size = 40,
  showText = true
}: { 
  className?: string,
  size?: number,
  showText?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
      <div 
        className="relative rounded-full" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary-100"
          style={{ borderWidth: `${Math.max(2, size / 10)}px` }}
        />
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"
          style={{ borderWidth: `${Math.max(2, size / 10)}px` }}
        />
      </div>
      {showText && (
        <p className="text-xs text-slate-400 font-medium animate-pulse">Memuat...</p>
      )}
    </div>
  )
}
