import { clsx } from 'clsx'
import { Loader2, TrendingUp, Users, Activity } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  return (
    <div className={clsx('flex items-center gap-2 font-bold tracking-tight text-gray-900', sizes[size])}>
      <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Activity className="w-4 h-4 text-white" />
      </div>
      PulseClass
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin', className)} />
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode
  variant?: 'default' | 'live' | 'slide' | 'poll' | 'quiz' | 'success'
  className?: string
}) {
  const v = {
    default: 'bg-gray-100 text-gray-600',
    live:    'bg-red-50 text-red-600 ring-1 ring-red-200',
    slide:   'bg-blue-50 text-blue-600',
    poll:    'bg-amber-50 text-amber-700',
    quiz:    'bg-emerald-50 text-emerald-700',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', v[variant], className)}>
      {children}
    </span>
  )
}

export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  )
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={clsx('h-1.5 bg-gray-150 rounded-full overflow-hidden', className)}>
      <div className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('bg-white border border-gray-150 rounded-2xl shadow-card', className)}>{children}</div>
}

export function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; color?: string
}) {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold', color || 'text-gray-900')}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl bg-brand-50">
            <Icon className="w-4 h-4 text-brand-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export function RoomCodeDisplay({ code }: { code: string }) {
  return (
    <div className="font-mono text-xl font-bold tracking-[0.25em] bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-brand-600 shadow-sm">
      {code}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description?: string
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>}
    </div>
  )
}