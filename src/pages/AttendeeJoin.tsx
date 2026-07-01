import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, LogIn } from 'lucide-react'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useAttendeeStore, useAuthStore } from '@/stores'

export default function AttendeeJoin() {
  const nav = useNavigate()
  const { setParticipant, setSession, setDisplayName, setWorkshop, setCurrentStep } = useAttendeeStore()
  const user = useAuthStore(s => s.user)
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

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm px-6 py-4 flex items-center justify-between">
        <Logo />
        <button onClick={() => nav('/')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Home</button>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="glass-panel p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Join a session</h1>
            <p className="text-sm text-gray-500 mb-7">Enter the room code from your host.</p>
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Your name</label>
                <input className="input" placeholder="e.g. Alex" value={name} onChange={e => setName(e.target.value)} maxLength={24} />
              </div>
              <div>
                <label className="label">Room code</label>
                <input className="input font-mono text-xl text-center tracking-[0.3em] uppercase font-bold"
                  placeholder="WX42KD" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6} onKeyDown={e => e.key === 'Enter' && join()} />
              </div>
              <button onClick={join} disabled={loading} className="btn-primary w-full py-3 justify-center text-base">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Joining…' : 'Join session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
