import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CheckCircle, Clock, LogIn, LogOut, RefreshCw, Trophy } from 'lucide-react'
import { Badge, EmptyState, Logo, StatCard } from '@/components/ui'
import { api } from '@/lib/api'
import { useAttendeeStore, useAuthStore } from '@/stores'
import type { AttendeeDashboard as AttendeeDashboardData, AttendeeDashboardSession } from '@/types'

function when(iso: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
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

  return (
    <div className="app-shell min-h-screen">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={() => nav('/join')} className="btn-primary btn-sm"><LogIn className="w-4 h-4" /> Join session</button>
            <button onClick={load} className="btn-secondary btn-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>
            <button onClick={signOut} className="btn-ghost text-sm"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">User dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Your session history</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.display_name || user?.email}</p>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Sessions" value={totals?.sessions ?? 0} icon={Clock} />
          <StatCard label="Live" value={totals?.live_sessions ?? 0} icon={LogIn} color={(totals?.live_sessions || 0) > 0 ? 'text-red-600' : undefined} />
          <StatCard label="Answers" value={totals?.answers ?? 0} icon={BarChart3} />
          <StatCard label="Accuracy" value={totals?.average_accuracy ? `${totals.average_accuracy}%` : '-'} icon={Trophy} />
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map(i => <div key={i} className="h-28 card animate-pulse" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="card">
            <EmptyState icon={Clock} title="No session activity yet" description="Join a live room and your answers, scores, and session history will appear here." />
          </div>
        ) : (
          <div className="grid gap-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Live or waiting</h2>
                <div className="grid gap-3">
                  {active.map(item => (
                    <div key={item.participant_id} className="card border-red-200 p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Badge variant="live">{item.status}</Badge>
                        <h3 className="font-bold text-gray-900 mt-2 truncate">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">Room {item.room_code} · step {item.current_step_index + 1} of {item.steps}</p>
                      </div>
                      <button onClick={() => resume(item)} className="btn-primary flex-shrink-0"><LogIn className="w-4 h-4" /> Resume</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Past sessions</h2>
              <div className="grid gap-3">
                {past.map(item => (
                  <div key={item.participant_id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Badge variant="success">completed</Badge>
                        <h3 className="font-bold text-gray-900 mt-2 truncate">{item.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{when(item.joined_at)} · room {item.room_code}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right flex-shrink-0">
                        <div><p className="text-lg font-bold text-gray-900">{item.answers}</p><p className="text-xs text-gray-400">answers</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{item.quiz_correct}/{item.quiz_total}</p><p className="text-xs text-gray-400">quiz</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{item.accuracy ?? '-'}{item.accuracy !== undefined && '%'}</p><p className="text-xs text-gray-400">accuracy</p></div>
                      </div>
                    </div>
                    {item.quiz_total > 0 && (
                      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.accuracy || 0}%` }} />
                      </div>
                    )}
                  </div>
                ))}
                {past.length === 0 && active.length > 0 && (
                  <div className="card">
                    <EmptyState icon={CheckCircle} title="No completed sessions yet" description="Completed sessions will move here after the host ends them." />
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
