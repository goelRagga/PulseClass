import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, Clock, LogOut, Plus, Radio, RefreshCw, TrendingUp, Users } from 'lucide-react'
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
  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={item.status === 'ended' ? 'default' : 'live'}>{item.status}</Badge>
            <Badge variant={item.mode === 'workshop' ? 'success' : 'slide'}>{item.mode || 'webinar'}</Badge>
            <span className="font-mono text-xs text-gray-400">{item.room_code}</span>
          </div>
          <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-1">{timeLabel(item.started_at)} · {item.steps} steps</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right flex-shrink-0">
          <div><p className="text-lg font-bold text-gray-900">{item.participant_count}</p><p className="text-xs text-gray-400">attendees</p></div>
          <div><p className="text-lg font-bold text-gray-900">{item.response_count}</p><p className="text-xs text-gray-400">answers</p></div>
          <div><p className="text-lg font-bold text-gray-900">{item.accuracy ?? '-'}{item.accuracy !== undefined && '%'}</p><p className="text-xs text-gray-400">accuracy</p></div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {item.status === 'ended'
          ? <button onClick={onLaunch} className="btn-secondary btn-sm"><Radio className="w-3.5 h-3.5" /> Run again</button>
          : <button onClick={onResume} className="btn-primary btn-sm"><Radio className="w-3.5 h-3.5" /> Open live</button>
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
    <div className="app-shell min-h-screen">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={() => nav('/host/create')} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> New session</button>
            <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
            <button onClick={signOut} className="btn-ghost text-sm"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Host dashboard</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Session operations</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.display_name || user?.email}</p>
          </div>
          <button onClick={() => nav('/host/workshops')} className="btn-secondary"><BookOpen className="w-4 h-4" /> Session library</button>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Sessions" value={totals?.sessions ?? 0} icon={Radio} />
          <StatCard label="Live now" value={totals?.live_sessions ?? 0} icon={Clock} color={(totals?.live_sessions || 0) > 0 ? 'text-red-600' : undefined} />
          <StatCard label="Attendees" value={totals?.attendees ?? 0} icon={Users} />
          <StatCard label="Responses" value={totals?.responses ?? 0} icon={TrendingUp} />
          <StatCard label="Avg accuracy" value={totals?.average_accuracy ? `${totals.average_accuracy}%` : '-'} icon={BarChart3} />
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map(i => <div key={i} className="h-32 card animate-pulse" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="card">
            <EmptyState icon={BookOpen} title="No sessions yet" description="Create a webinar or workshop session, launch a room, and analytics will appear here." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent sessions</h2>
                <span className="text-xs text-gray-400">{sessions.length} total</span>
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
              <div className="card p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Response health</h2>
                <div className="space-y-4">
                  {sessions.slice(0, 5).map(s => {
                    const max = Math.max(...sessions.map(x => x.response_count), 1)
                    return (
                      <div key={s.id}>
                        <div className="flex justify-between gap-3 text-xs mb-1">
                          <span className="text-gray-600 truncate">{s.topic}</span>
                          <span className="font-semibold text-gray-500">{s.response_count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={clsx('h-full rounded-full', s.status === 'ended' ? 'bg-gray-400' : 'bg-brand-500')} style={{ width: `${Math.round((s.response_count / max) * 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
