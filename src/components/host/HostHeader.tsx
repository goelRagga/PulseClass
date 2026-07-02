import { ChevronRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Logo } from '@/components/ui'

export type HostBreadcrumb = {
  label: string
  to?: string
}

export function HostHeader({
  searchPlaceholder = 'Search sessions, resources...',
  showSearch = true,
  searchValue,
  onSearchChange,
  rightSlot,
  logoSize = 'xl',
}: {
  searchPlaceholder?: string
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  rightSlot?: ReactNode
  logoSize?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [localSearch, setLocalSearch] = useState('')
  const value = searchValue ?? localSearch
  const handleSearch = (nextValue: string) => {
    if (onSearchChange) onSearchChange(nextValue)
    else setLocalSearch(nextValue)
  }

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-5 min-w-0 flex-1">
        <Logo size={logoSize} />
        {showSearch && (
          <label className="relative hidden lg:flex items-center w-full max-w-md">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={value}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-slate-200/70 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all"
            />
          </label>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {rightSlot}
      </div>
    </header>
  )
}

export function HostBreadcrumbs({ items }: { items: HostBreadcrumb[] }) {
  const nav = useNavigate()

  if (items.length === 0) return null

  return (
    <nav className="min-w-0 flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
      {items.map((crumb, index) => (
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
  )
}
