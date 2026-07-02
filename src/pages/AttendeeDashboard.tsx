import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, CheckCircle, Clock, LogIn, LogOut, RefreshCw, Trophy,
  LayoutDashboard, ArrowUpRight, Radio, Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useAttendeeStore, useAuthStore } from '@/stores'
import type { AttendeeDashboard as AttendeeDashboardData, AttendeeDashboardSession } from '@/types'

function when(iso: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function SideNavItem({ label, icon: Icon, active, onClick }: {
  label: string; icon: React.ElementType; active?: boolean; onClick: () => void
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
      <Icon className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400')} />
      <span>{label}</span>
    </button>
  )
}

function MetricCard({ label, value, sub, subColor, icon: Icon, iconBg, iconColor }: {
  label: string; value: string | number; sub?: string; subColor?: string
  icon: React.ElementType; iconBg: string; iconColor: string
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
        {sub && <span className={clsx('text-xs font-semibold', subColor || 'text-slate-400')}>{sub}</span>}
      </div>
    </div>
  )
}

export default function AttendeeDashboard() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { setParticipant, setSession, setDisplayName, setWorkshop, setCurrentStep } = useAttendeeStore()
  const [data, setData] = useState<AttendeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try { setData(await api.getAttendeeDashboard() as AttendeeDashboardData) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const signOut = () => {
    logout()
    nav('/auth?role=attendee', { replace: true })
  }

  const resume = async (item: AttendeeDashboardSession) => {
    const session = await api.getSessionByCode(item.room_code) as any
    setParticipant(item.participant_id)
    setSession(item.session_id, item.room_code)
    setDisplayName(user?.display_name || user?.email || '')
    if (session.workshop) setWorkshop(session.workshop)
    setCurrentStep(session.current_step_index || 0, session.last_event_id || '')
    nav(session.status === 'waiting' ? '/attendee/waiting' : '/attendee/live')
  }

  const totals = data?.totals
  const sessions = data?.sessions || []
  const active = sessions.filter(s => s.status !== 'ended')
  const past = sessions.filter(s => s.status === 'ended')
  const userName = user?.display_name || user?.email || 'Attendee'

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f8f9ff]">

      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/80 py-6 px-4 z-50">
        <div className="px-2 mb-8">
          <Logo size="md" />
        </div>

        <nav className="flex-1 space-y-1">
          <SideNavItem label="Dashboard" icon={LayoutDashboard} active onClick={() => {}} />
          <SideNavItem label="Join Session" icon={LogIn} onClick={() => nav('/join')} />
        </nav>

        <div className="mt-auto p-3.5 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4648d4] to-[#6b38d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {userName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-900 truncate">{userName.toUpperCase()}</p>
              <p className="text-[11px] font-medium text-slate-400">Attendee</p>
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
          <div />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={load}
              aria-label="Refresh"
              className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all active:scale-95"
            >
              <RefreshCw className="h-[18px] w-[18px]" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1.5" />
            <button
              type="button"
              onClick={() => nav('/join')}
              className="flex items-center gap-2 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-[0_8px_24px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <LogIn className="h-4 w-4" />
              Join Session
            </button>
          </div>
        </header>

        {/* Scrollable canvas */}
        <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

          {/* Page header */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4648d4]">Attendee Dashboard</p>
            <h1 className="text-[30px] font-bold leading-tight tracking-tight text-slate-900">Your Sessions</h1>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Track your activity, answers, and performance across sessions.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Metric tiles */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)]">
                  <div className="flex items-start justify-between mb-5">
                    <div className="h-2.5 w-20 rounded bg-slate-200/90 animate-pulse" />
                    <div className="h-9 w-9 rounded-lg bg-slate-200/80 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-14 rounded bg-slate-200/90 animate-pulse" />
                    <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Sessions"
                value={totals?.sessions ?? 0}
                icon={Radio}
                iconBg="bg-[#e1e0ff]"
                iconColor="text-[#4648d4]"
              />
              <MetricCard
                label="Live"
                value={totals?.live_sessions ?? 0}
                sub={(totals?.live_sessions || 0) > 0 ? 'Active' : undefined}
                subColor="text-red-500 font-bold"
                icon={Zap}
                iconBg="bg-red-50"
                iconColor="text-red-500"
              />
              <MetricCard
                label="Answers"
                value={totals?.answers ?? 0}
                icon={BarChart3}
                iconBg="bg-[#e9ddff]"
                iconColor="text-[#6b38d4]"
              />
              <MetricCard
                label="Avg Accuracy"
                value={totals?.average_accuracy ? `${totals.average_accuracy}%` : '—'}
                sub={totals?.average_accuracy ? 'Live metric' : 'No data'}
                subColor="text-slate-400"
                icon={Trophy}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
            </div>
          )}

          {/* Session content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/80 p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] space-y-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 rounded-full bg-slate-200/90 animate-pulse" />
                        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                      </div>
                      <div className="h-5 w-3/4 rounded bg-slate-200/90 animate-pulse" />
                      <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-3 gap-5 shrink-0">
                      {[1, 2, 3].map(s => (
                        <div key={s} className="space-y-2">
                          <div className="h-6 w-10 rounded bg-slate-200/90 animate-pulse" />
                          <div className="h-2.5 w-12 rounded bg-slate-100 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-12 text-center shadow-[0_4px_6px_rgba(99,102,241,0.05)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e1e0ff] mb-4">
                <Clock className="h-7 w-7 text-[#4648d4]" />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900">No session activity yet</h3>
              <p className="mt-2 text-[13px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Join a live room and your answers, scores, and session history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Active sessions */}
              {active.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Live or waiting</h2>
                  <div className="space-y-3">
                    {active.map(item => (
                      <article
                        key={item.participant_id}
                        className="bg-white/70 backdrop-blur-xl border border-red-200/60 rounded-2xl p-6 shadow-[0_4px_6px_rgba(239,68,68,0.06),0_10px_15px_rgba(239,68,68,0.05)] flex items-center justify-between gap-4 group hover:bg-white/90 transition-colors duration-200"
                      >
                        <div className="min-w-0">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider bg-red-50 text-red-600 border-red-200">
                            {item.status}
                          </span>
                          <h3 className="text-[17px] font-bold text-slate-900 mt-2 truncate group-hover:text-[#4648d4] transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[12px] text-slate-500 mt-1">
                            Room {item.room_code} · step {item.current_step_index + 1} of {item.steps}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => resume(item)}
                          className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-[#4648d4] hover:text-white hover:border-[#4648d4] transition-all duration-150 active:scale-95 shrink-0"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Resume
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Past sessions */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Past sessions</h2>
                  <span className="text-[12px] text-slate-400">{past.length} total</span>
                </div>

                {past.length === 0 && active.length > 0 ? (
                  <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 text-center shadow-[0_4px_6px_rgba(99,102,241,0.05)]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 mb-3">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-[14px] font-semibold text-slate-700">No completed sessions yet</p>
                    <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                      Completed sessions will move here after the host ends them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {past.map(item => (
                      <article
                        key={item.participant_id}
                        className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] space-y-4 group hover:bg-white/90 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0 flex-1">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-200">
                              completed
                            </span>
                            <h3 className="text-[17px] font-bold text-slate-900 mt-2 truncate group-hover:text-[#4648d4] transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-[12px] text-slate-500 mt-1">
                              {when(item.joined_at)} · room {item.room_code}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-center shrink-0">
                            <div>
                              <p className="text-[22px] font-bold leading-none text-slate-900">{item.answers}</p>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">answers</p>
                            </div>
                            <div>
                              <p className="text-[22px] font-bold leading-none text-slate-900">{item.quiz_correct}/{item.quiz_total}</p>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">quiz</p>
                            </div>
                            <div>
                              <p className={clsx(
                                'text-[22px] font-bold leading-none',
                                item.accuracy !== undefined && item.accuracy !== null ? 'text-[#4648d4]' : 'text-slate-900'
                              )}>
                                {item.accuracy !== undefined && item.accuracy !== null ? `${item.accuracy}%` : '—'}
                              </p>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold mt-1">accuracy</p>
                            </div>
                          </div>
                        </div>
                        {item.quiz_total > 0 && (
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#4648d4] to-[#6b38d4]"
                              style={{ width: `${item.accuracy || 0}%` }}
                            />
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}
