import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="app-shell min-h-screen flex flex-col">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm px-6 py-4"><Logo /></nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-sm glass-panel p-10 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto mb-5">
            <div className="w-7 h-7 rounded-full border-[3px] border-brand-500 border-t-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting for host…</h2>
          <p className="text-sm text-gray-500 mb-6">
            Hi <span className="font-semibold text-gray-700">{displayName}</span>! The session will start soon.
          </p>
          {roomCode && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Room code</p>
              <div className="font-mono text-xl font-bold tracking-[0.3em] text-brand-700 bg-brand-50/80 border border-brand-200 rounded-2xl py-2.5 backdrop-blur-xl">{roomCode}</div>
            </div>
          )}
          <button onClick={() => nav('/join')} className="btn-ghost text-sm">Leave session</button>
        </div>
      </div>
    </div>
  )
}
