import { clsx } from 'clsx'
import { Loader2, TrendingUp, Users, Activity } from 'lucide-react'

const LOGO_SRC = 'https://res.cloudinary.com/dvbdvkhs/image/upload/v1782943876/Screenshot_2026-07-02_at_3.38.00_AM_amx1nt.png'

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  return (
    <div className={clsx('flex items-center gap-2.5 font-semibold tracking-tight text-gray-900', sizes[size])}>
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-600 shadow-[0_10px_24px_rgba(59,110,244,0.28)] ring-1 ring-white/70">
        <img src={LOGO_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/10" />
        <Activity className="relative z-[1] h-4 w-4 text-white" />
      </div>
      IntelliMeet
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
    default: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    live: 'bg-red-50 text-red-600 ring-red-200/80',
    slide: 'bg-brand-50 text-brand-700 ring-brand-200/80',
    poll: 'bg-indigo-50 text-indigo-700 ring-indigo-200/80',
    quiz: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1', v[variant], className)}>
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
    <div className={clsx('h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200/80', className)}>
      <div className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('card', className)}>{children}</div>
}

export function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; color?: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold', color || 'text-gray-900')}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100">
            <Icon className="w-4 h-4 text-brand-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export function RoomCodeDisplay({ code }: { code: string }) {
  return (
    <div className="font-mono text-xl font-bold tracking-[0.25em] bg-white/90 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-brand-700 shadow-sm backdrop-blur-xl">
      {code}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, imageSrc, imageAlt }: {
  icon: React.ElementType; title: string; description?: string
  imageSrc?: string; imageAlt?: string
}) {
  return (
    <div className="text-center py-14 px-4">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt || ''} className="h-full w-full object-cover" />
        ) : (
          <Icon className="w-6 h-6 text-brand-500" />
        )}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">{description}</p>}
    </div>
  )
}
