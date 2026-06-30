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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-150 shadow-sm px-6 py-4"><Logo /></nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-sm bg-white border border-gray-150 rounded-3xl shadow-card-lg p-10 animate-scale-in">
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
              <div className="font-mono text-xl font-bold tracking-[0.3em] text-brand-600 bg-brand-50 border border-brand-200 rounded-xl py-2.5">{roomCode}</div>
            </div>
          )}
          <button onClick={() => nav('/join')} className="btn-ghost text-sm">Leave session</button>
        </div>
      </div>
    </div>
  )
}