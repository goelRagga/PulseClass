import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui'
import { useAttendeeStore } from '@/stores'
import { useRealtimeSession } from '@/hooks/useRealtime'
import { api } from '@/lib/api'

export default function AttendeeWaiting() {
  const nav = useNavigate()
  const { sessionId, roomCode, displayName, setWorkshop, setCurrentStep } = useAttendeeStore()

  useRealtimeSession(sessionId, {
    onStepAdvance: async (row) => {
      if (row.status === 'live') {
        try {
          const s = await api.getSessionByCode(roomCode!) as any
          if (s.workshop) setWorkshop(s.workshop)
          setCurrentStep(s.current_step_index || 0, s.last_event_id || '')
        } catch { /* */ }
        nav('/attendee/live')
      }
    },
  })

  useEffect(() => {
    if (!roomCode) { nav('/join'); return }
    const iv = setInterval(async () => {
      try {
        const s = await api.getSessionByCode(roomCode) as any
        if (s.status === 'live') {
          clearInterval(iv)
          if (s.workshop) setWorkshop(s.workshop)
          setCurrentStep(s.current_step_index || 0, s.last_event_id || '')
          nav('/attendee/live')
        }
      } catch { /* */ }
    }, 3000)
    return () => clearInterval(iv)
  }, [roomCode, nav, setWorkshop, setCurrentStep])

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      {/* Top bar */}
      <nav className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center px-8 sticky top-0 z-40">
        <Logo size="md" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Spinner card */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e1e0ff] mb-6">
              <div className="h-7 w-7 rounded-full border-[3px] border-[#4648d4] border-t-transparent animate-spin" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4648d4] mb-2">Session room</p>
            <h2 className="text-[22px] font-bold text-slate-900 mb-2">Waiting for host…</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              Hi <span className="font-semibold text-slate-700">{displayName}</span>! The session will start soon.
            </p>

            {roomCode && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">Room code</p>
                <div className="font-mono text-xl font-bold tracking-[0.3em] text-[#4648d4] bg-[#eff4ff] border border-[#4648d4]/20 rounded-xl py-3">
                  {roomCode}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => nav('/join')}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Leave session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
