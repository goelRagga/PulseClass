import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  Bell,
  BookOpen,
  RefreshCw,
  Search,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Rocket,
  Users,
  BarChart3,
  Settings,
  Heart,
  ArrowUpRight,
  Radio,
  Cpu,
  LogOut,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore, useHostStore } from '@/stores'
import type { HostDashboard as HostDashboardData, HostDashboardSession, Session, Workshop } from '@/types'

function formatStartedAt(iso?: string) {
  if (!iso) return 'Not started'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function safePercent(value: number, max: number) {
  if (!max) return 0
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
}

function SideNavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[#8455ef] text-white shadow-md'
          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
      )}
    >
      <Icon className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
      <span>{label}</span>
    </button>
  )
}

function MetricCard({
  label,
  value,
  sub,
  subColor,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string | number
  sub?: string
  subColor?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 leading-tight">{label}</span>
        <div className={clsx('p-2 rounded-lg shrink-0', iconBg)}>
          <Icon className={clsx('h-5 w-5', iconColor)} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-bold leading-none tracking-tight text-slate-900">{value}</span>
        {sub && (
          <span className={clsx('text-xs font-semibold', subColor || 'text-slate-400')}>{sub}</span>
        )}
      </div>
    </div>
  )
}

function SessionCard({
  item,
  onLaunch,
  onResume,
}: {
  item: HostDashboardSession
  onLaunch: () => void
  onResume: () => void
}) {
  const isEnded = item.status === 'ended'
  const percent = item.steps > 0 ? safePercent(item.current_step_index, Math.max(item.steps - 1, 1)) : 0

  return (
    <article className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] space-y-4 group hover:bg-white/90 transition-colors duration-200">
      <div className="flex justify-between items-start gap-6">
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                'px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider',
                isEnded
                  ? 'bg-slate-100 text-slate-500 border-slate-200/60'
                  : 'bg-[#dfe5ff] text-[#4648d4] border-[#4648d4]/20'
              )}
            >
              {item.status}
            </span>
            <span
              className={clsx(
                'px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider',
                item.mode === 'workshop'
                  ? 'bg-[#e1e0ff] text-[#4648d4] border-[#4648d4]/20'
                  : 'bg-[#e9ddff] text-[#6b38d4] border-[#6b38d4]/20'
              )}
            >
              {item.mode || 'webinar'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono opacity-70">{item.room_code}</span>
          </div>

          <h3 className="text-[17px] font-bold leading-snug text-slate-900 group-hover:text-[#4648d4] transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <CalendarDays className="h-[14px] w-[14px] shrink-0" />
            <span>{formatStartedAt(item.started_at)} · {item.steps} steps</span>
          </div>
        </div>

        <div className="flex gap-6 text-center shrink-0">
          <div>
            <p className="text-[22px] font-bold leading-none text-slate-900">{item.participant_count}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">attendees</p>
          </div>
          <div>
            <p className="text-[22px] font-bold leading-none text-slate-900">{item.response_count}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">answers</p>
          </div>
          <div>
            <p className={clsx(
              'text-[22px] font-bold leading-none',
              item.accuracy !== undefined && item.accuracy !== null ? 'text-[#4648d4]' : 'text-slate-900'
            )}>
              {item.accuracy !== undefined && item.accuracy !== null ? `${item.accuracy}%` : '-%'}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">accuracy</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700 ease-out',
              percent > 0
                ? 'bg-gradient-to-r from-[#4648d4] to-[#6b38d4]'
                : 'bg-slate-200'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <button
          type="button"
          onClick={isEnded ? onLaunch : onResume}
          className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-[#4648d4] hover:text-white hover:border-[#4648d4] transition-all duration-150 active:scale-95 shrink-0"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          {isEnded ? 'Run again' : 'Open live'}
        </button>
      </div>
    </article>
  )
}

export default function HostDashboard() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { setWorkshop, setSession } = useHostStore()

  const signOut = () => {
    logout()
    nav('/auth?role=host', { replace: true })
  }
  const [data, setData] = useState<HostDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const startedAt = Date.now()
    setError('')
    setLoading(true)
    try {
      setData(await api.getHostDashboard() as HostDashboardData)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed))
      }
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const launchSession = async (workshopId: string) => {
    const workshop = await api.getWorkshop(workshopId) as Workshop
    setWorkshop(workshop)
    nav(`/host/setup/${workshop.id}`)
  }

  const resumeSession = async (item: HostDashboardSession) => {
    const workshop = await api.getWorkshop(item.workshop_id) as Workshop
    setWorkshop(workshop)
    setSession({
      id: item.id,
      workshop_id: item.workshop_id,
      room_code: item.room_code,
      status: item.status,
      current_step_index: item.current_step_index,
    } as Session)
    nav(`/host/live/${item.id}`)
  }

  const totals = data?.totals
  const sessions = data?.sessions || []
  const sessionItems = [
    ...sessions.filter(s => s.status !== 'ended'),
    ...sessions.filter(s => s.status === 'ended'),
  ].slice(0, 3)
  const showSkeletons = loading

  const maxResponses = Math.max(...sessions.map(s => s.response_count), 1)
   const userName = user?.display_name || (user as any)?.name || 'Host'

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f8f9ff]">

      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/80 py-6 px-4 z-50">
        <div className="px-2 mb-8">
          <Logo size="md" />
        </div>

        <nav className="flex-1 space-y-1">
          <SideNavItem label="Dashboard"  icon={LayoutDashboard} active onClick={() => nav('/host/dashboard')} />
          <SideNavItem label="Sessions Library"   icon={CalendarDays}    onClick={() => nav('/host/workshops')} />
          {/* <SideNavItem label="Library"    icon={BookOpen}        onClick={() => nav('/host/workshops')} />
          <SideNavItem label="Analytics"  icon={BarChart3}       onClick={() => {}} />
          <SideNavItem label="Settings"   icon={Settings}        onClick={() => {}} /> */}
        </nav>

        <div className="mt-auto p-3.5 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4648d4] to-[#6b38d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {userName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-900 truncate">{userName.toUpperCase()}</p>
              <p className="text-[11px] text-left font-medium text-slate-400">Host</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Logout"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <label className="relative hidden lg:flex items-center w-96">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search sessions, resources..."
                className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-slate-200/70 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all"
              />
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={load}
              aria-label="Refresh"
              className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all active:scale-95"
            >
              <RefreshCw className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all active:scale-95"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-red-500 rounded-full border border-white" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1.5" />
            <button
              type="button"
              onClick={() => nav('/host/create')}
              className="flex items-center gap-2 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-[0_8px_24px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
          </div>
        </header>

        {/* Scrollable canvas */}
        <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

          {/* Page header */}
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4648d4]">Host Dashboard</p>
              <h1 className="text-[30px] font-bold leading-tight tracking-tight text-slate-900">Sessions Overview</h1>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Manage and monitor your enterprise meeting activity in real-time.
              </p>
            </div>
            {/* <button
              type="button"
              onClick={() => nav('/host/workshops')}
              className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-slate-200/80 px-5 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-white transition-all shadow-sm shrink-0"
            >
              <BookOpen className="h-4 w-4" />
              Session library
            </button> */}
          </div>

          {/* Metric tiles */}
          {showSkeletons ? (
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-[132px] rounded-2xl bg-white/70 border border-slate-200/80 p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)]">
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-2.5 w-24 rounded bg-slate-200/90 animate-pulse" />
                    <div className="h-9 w-9 rounded-lg bg-slate-200/80 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-16 rounded bg-slate-200/90 animate-pulse" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              <MetricCard
                label="Total Sessions"
                value={totals?.sessions ?? 0}
                sub={totals?.sessions ? '+12%' : undefined}
                subColor="text-[#4648d4] font-bold"
                icon={Radio}
                iconBg="bg-[#e1e0ff]"
                iconColor="text-[#4648d4]"
              />
              <MetricCard
                label="Live Now"
                value={totals?.live_sessions ?? 0}
                sub="Stable"
                subColor="text-slate-400"
                icon={Clock3}
                iconBg="bg-[#e9ddff]"
                iconColor="text-[#6b38d4]"
              />
              <MetricCard
                label="Attendees"
                value={totals?.attendees ?? 0}
                sub="Registered"
                subColor="text-slate-400"
                icon={Users}
                iconBg="bg-slate-100"
                iconColor="text-slate-500"
              />
              <MetricCard
                label="Responses"
                value={totals?.responses ?? 0}
                sub={totals?.responses ? '+24%' : undefined}
                subColor="text-amber-500 font-bold"
                icon={MessageSquare}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
              <MetricCard
                label="Avg Accuracy"
                value={totals?.average_accuracy ? `${totals.average_accuracy}%` : '—'}
                sub={totals?.average_accuracy ? 'Live metric' : 'No data'}
                subColor="text-slate-400"
                icon={BarChart3}
                iconBg="bg-[#dce9ff]"
                iconColor="text-[#4648d4]"
              />
            </div>
          )}

          {/* Sessions + Right panel */}
          <div className="grid grid-cols-12 gap-6 items-start">

            {/* Sessions — 8 cols */}
            <div className="col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Recent Sessions</h2>
                <span className="text-[12px] text-slate-400">{sessions.length} total</span>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] space-y-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-14 rounded-full bg-slate-200/90 animate-pulse" />
                            <div className="h-5 w-16 rounded-full bg-slate-100 animate-pulse" />
                            <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                          </div>
                          <div className="h-5 w-4/5 rounded bg-slate-200/90 animate-pulse" />
                          <div className="h-3 w-44 rounded bg-slate-100 animate-pulse" />
                        </div>
                        <div className="grid grid-cols-3 gap-5 shrink-0">
                          {[1, 2, 3].map(stat => (
                            <div key={stat} className="space-y-2">
                              <div className="h-6 w-10 rounded bg-slate-200/90 animate-pulse" />
                              <div className="h-2.5 w-12 rounded bg-slate-100 animate-pulse" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 animate-pulse" />
                        <div className="h-8 w-24 rounded-lg bg-slate-200/80 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessionItems.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-12 text-center shadow-[0_4px_6px_rgba(99,102,241,0.05)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e1e0ff] mb-4">
                    <Rocket className="h-7 w-7 text-[#4648d4]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900">No sessions yet</h3>
                  <p className="mt-2 text-[13px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Create a webinar or workshop and your session analytics will appear here.
                  </p>
                </div>
              ) : (
                sessionItems.map(item => (
                  <SessionCard
                    key={item.id}
                    item={item}
                    onLaunch={() => launchSession(item.workshop_id)}
                    onResume={() => resumeSession(item)}
                  />
                ))
              )}
            </div>

            {/* Right panel — 4 cols */}
            <div className="col-span-4 sticky top-24 space-y-5">

              {/* Response Health */}
              <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)]">
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="h-5 w-5 text-[#4648d4]" />
                  <h2 className="text-[16px] font-bold text-slate-900">Response Health</h2>
                </div>

                {showSkeletons ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-2/3 rounded bg-slate-200/80 animate-pulse" />
                        <div className="h-2 w-full rounded-full bg-slate-100 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-[13px] text-slate-400 text-center py-6">No session data yet</p>
                ) : (
                  <div className="space-y-5">
                    {sessions.slice(0, 4).map(s => {
                      const pct = s.response_count > 0
                        ? Math.min(100, Math.round((s.response_count / maxResponses) * 100))
                        : 0
                      return (
                        <div key={s.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[13px]">
                            <p className="truncate text-slate-500 flex-1">{s.title}</p>
                            <span className={clsx(
                              'font-bold shrink-0',
                              s.response_count > 0 ? 'text-[#4648d4]' : 'text-slate-700'
                            )}>
                              {s.response_count}
                            </span>
                          </div>
                          <div className={clsx(
                            'w-full bg-slate-100 rounded-full overflow-hidden',
                            s.response_count > 0 ? 'h-2' : 'h-1'
                          )}>
                            {pct > 0 && (
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#4648d4] to-[#6b38d4]"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* <div className="pt-5 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    className="w-full py-2 text-[#4648d4] font-bold text-[13px] hover:underline underline-offset-4 decoration-2 transition-all"
                  >
                    View Full Report
                  </button>
                </div> */}
              </div>

              {/* Upgrade card */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#4648d4] to-[#6b38d4] text-white shadow-xl group">
                <div className="absolute -right-5 -bottom-5 opacity-20 group-hover:scale-110 transition-transform duration-500">
                  <Cpu className="h-[112px] w-[112px]" />
                </div>
                <h4 className="text-[16px] font-bold mb-1.5 relative">Upgrade to Copilot+</h4>
                <p className="text-[13px] opacity-90 mb-4 leading-relaxed relative">
                  Get real-time AI suggestions during your live sessions.
                </p>
                <button
                  type="button"
                  className="relative bg-white text-[#4648d4] px-4 py-2 rounded-lg font-bold text-[12px] shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
