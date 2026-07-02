import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Loader2, LogIn, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useAttendeeStore, useAuthStore } from '@/stores'

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

export default function AttendeeJoin() {
  const nav = useNavigate()
  const { setParticipant, setSession, setDisplayName, setWorkshop, setCurrentStep } = useAttendeeStore()
  const { user, logout } = useAuthStore()
  const [name, setName] = useState(user?.display_name || '')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const join = async () => {
    if (!name.trim()) { setError('Enter your name first.'); return }
    if (code.trim().length !== 6) { setError('Room codes are 6 characters.'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.joinSession(code.toUpperCase(), name.trim()) as {
        participant_id: string; session_id: string; room_code: string
        status: string; current_step_index: number; last_event_id: string | null
        workshop: { steps: any[]; title: string } | null
      }
      setParticipant(res.participant_id)
      setSession(res.session_id, res.room_code)
      setDisplayName(name.trim())
      if (res.workshop) {
        setWorkshop(res.workshop)
        setCurrentStep(res.current_step_index, res.last_event_id || '')
      }
      nav(res.status === 'waiting' ? '/attendee/waiting' : '/attendee/live')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join')
    } finally { setLoading(false) }
  }

  const signOut = () => {
    logout()
    nav('/auth?role=attendee', { replace: true })
  }

  const userName = user?.display_name || user?.email || 'Attendee'

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f8f9ff]">

      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/80 py-6 px-4 z-50">
        <div className="px-2 mb-8">
          <Logo size="md" />
        </div>

        <nav className="flex-1 space-y-1">
          <SideNavItem label="Dashboard" icon={LayoutDashboard} onClick={() => nav('/attendee/dashboard')} />
          <SideNavItem label="Join Session" icon={LogIn} active onClick={() => {}} />
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
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center px-8 sticky top-0 z-40 shrink-0">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4648d4]">Attendee</p>
            <p className="text-[15px] font-bold text-slate-900">Join a session</p>
          </div>
        </header>

        {/* Centered form */}
        <main className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">Enter room code</h1>
              <p className="text-[13px] text-slate-500 mt-1.5">Get the 6-character code from your host.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-8 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)]">
              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-1.5">
                    Your name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-[#eff4ff] border border-slate-200/70 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={24}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-1.5">
                    Room code
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-[#eff4ff] border border-slate-200/70 rounded-xl font-mono text-xl text-center tracking-[0.3em] uppercase font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all"
                    placeholder="WX42KD"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && join()}
                  />
                </div>

                <button
                  type="button"
                  onClick={join}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white py-3 rounded-xl text-[14px] font-semibold shadow-[0_8px_24px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {loading ? 'Joining…' : 'Join session'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
