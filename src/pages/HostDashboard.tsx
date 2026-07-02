import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, Clock, LogOut, Plus, Radio, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, EmptyState, Logo, StatCard } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore, useHostStore } from '@/stores'
import type { HostDashboard as HostDashboardData, HostDashboardSession, Session, Workshop } from '@/types'

function timeLabel(iso?: string) {
  if (!iso) return 'Not started'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function SessionRow({ item, onLaunch, onResume }: {
  item: HostDashboardSession
  onLaunch: () => void
  onResume: () => void
}) {
  const pct = item.steps > 0 ? Math.round((item.current_step_index / Math.max(item.steps - 1, 1)) * 100) : 0
  const isLive = item.status !== 'ended'
  return (
    <div className={clsx(
      'group relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
      isLive
        ? 'border-indigo-200/70 bg-gradient-to-br from-white via-white to-indigo-50/40 shadow-md shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/15'
        : 'border-slate-200/70 bg-white/80 shadow-sm hover:shadow-lg hover:shadow-slate-500/10 hover:border-slate-300'
    )}>
      {isLive && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500" />}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={item.status === 'ended' ? 'default' : 'live'}>{item.status}</Badge>
            <Badge variant={item.mode === 'workshop' ? 'success' : 'slide'}>{item.mode || 'webinar'}</Badge>
            <span className="font-mono text-xs text-slate-400 tracking-wide">{item.room_code}</span>
          </div>
          <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{timeLabel(item.started_at)} · {item.steps} steps</p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:text-right shrink-0">
          <div><p className="text-lg font-bold text-slate-900">{item.participant_count}</p><p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">attendees</p></div>
          <div><p className="text-lg font-bold text-slate-900">{item.response_count}</p><p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">answers</p></div>
          <div><p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{item.accuracy ?? '-'}{item.accuracy !== undefined && '%'}</p><p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">accuracy</p></div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full transition-all duration-700 ease-out', isLive ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500' : 'bg-slate-400')} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">{pct}%</span>
        {item.status === 'ended'
          ? <button onClick={onLaunch} className="btn-secondary btn-sm shrink-0"><Radio className="w-3.5 h-3.5" /> Run again</button>
          : <button onClick={onResume} className="btn-primary btn-sm shrink-0 shadow-md shadow-indigo-500/25"><Radio className="w-3.5 h-3.5" /> Open live</button>
        }
      </div>
    </div>
  )
}

export default function HostDashboard() {
  const nav = useNavigate()
  const { user, logout } = useAuthStore()
  const { setWorkshop, setSession } = useHostStore()
  const [data, setData] = useState<HostDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try { setData(await api.getHostDashboard() as HostDashboardData) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const signOut = () => {
    logout()
    nav('/auth?role=host', { replace: true })
  }

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
  const live = sessions.filter(s => s.status !== 'ended')
  const ended = sessions.filter(s => s.status === 'ended')

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-500/10 blur-3xl" />
        <div className="absolute -top-20 -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-fuchsia-400/15 to-sky-400/10 blur-3xl" />
      </div>

      <nav className="relative z-20 sticky top-0 border-b border-white/60 bg-white/70 backdrop-blur-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0"><Logo /></div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => nav('/host/create')} className="btn-primary btn-sm shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 transition-all"><Plus className="w-4 h-4" /> New session</button>
            <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
            <button onClick={signOut} className="btn-ghost text-sm"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-8 animate-fade-in">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 backdrop-blur-xl shadow-sm">
              <Sparkles className="w-3 h-3" /> Host workspace
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">
              Session operations
            </h1>
            <p className="text-sm text-slate-500 mt-2 truncate">{user?.display_name || user?.email}</p>
          </div>
          <button onClick={() => nav('/host/workshops')} className="btn-secondary shrink-0"><BookOpen className="w-4 h-4" /> Session library</button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 backdrop-blur animate-fade-in">{error}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-8 animate-fade-in">
          <StatCard label="Sessions" value={totals?.sessions ?? 0} icon={Radio} />
          <StatCard label="Live now" value={totals?.live_sessions ?? 0} icon={Clock} color={(totals?.live_sessions || 0) > 0 ? 'text-red-600' : undefined} />
          <StatCard label="Attendees" value={totals?.attendees ?? 0} icon={Users} />
          <StatCard label="Responses" value={totals?.responses ?? 0} icon={TrendingUp} />
          <StatCard label="Avg accuracy" value={totals?.average_accuracy ? `${totals.average_accuracy}%` : '-'} icon={BarChart3} />
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/70 animate-pulse" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/70 p-2 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(79,70,229,0.2)]">
            <EmptyState icon={BookOpen} title="No sessions yet" description="Create a webinar or workshop session, launch a room, and analytics will appear here." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 animate-fade-in">
            <section className="min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Recent sessions</h2>
                <span className="text-xs text-slate-400">{sessions.length} total</span>
              </div>
              <div className="space-y-3">
                {[...live, ...ended].map(item => (
                  <SessionRow
                    key={item.id}
                    item={item}
                    onLaunch={() => launchSession(item.workshop_id)}
                    onResume={() => resumeSession(item)}
                  />
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 backdrop-blur-2xl shadow-[0_10px_40px_-20px_rgba(79,70,229,0.25)]">
                <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/25 to-violet-500/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Response health</h2>
                  </div>
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map(s => {
                      const max = Math.max(...sessions.map(x => x.response_count), 1)
                      const w = Math.round((s.response_count / max) * 100)
                      return (
                        <div key={s.id}>
                          <div className="flex justify-between gap-3 text-xs mb-1.5">
                            <span className="text-slate-600 truncate min-w-0">{s.topic}</span>
                            <span className="font-semibold text-slate-500 tabular-nums shrink-0">{s.response_count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all duration-700 ease-out', s.status === 'ended' ? 'bg-slate-400' : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500')} style={{ width: `${w}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
