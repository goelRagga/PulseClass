import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'

export type HostBreadcrumb = {
  label: string
  to?: string
}

export function HostHeader({
  breadcrumbs = [],
  backTo,
  backLabel = 'Back',
  rightSlot,
  logoSize = 'xl',
}: {
  breadcrumbs?: HostBreadcrumb[]
  backTo?: string
  backLabel?: string
  rightSlot?: ReactNode
  logoSize?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const nav = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(92,70,210,0.06)]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-[-40px] h-40 w-40 rounded-full bg-[#8b6cff]/18 blur-3xl" />
          <div className="absolute right-0 top-[-30px] h-28 w-72 rounded-full bg-[#c9bbff]/24 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8b6cff]/30 to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {backTo && (
              <button
                type="button"
                onClick={() => nav(backTo)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700',
                  'shadow-[0_8px_20px_rgba(29,55,133,0.06)] transition hover:border-slate-300 hover:bg-slate-50 active:translate-y-[1px] active:scale-[0.99]'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{backLabel}</span>
              </button>
            )}

            <Logo size={logoSize} />
          </div>

          {breadcrumbs.length > 0 && (
            <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] font-medium text-slate-500 sm:flex">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                  {crumb.to ? (
                    <button
                      type="button"
                      onClick={() => nav(crumb.to!)}
                      className="truncate text-slate-500 transition hover:text-[#4b53ff]"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="truncate text-slate-900">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  )
}
