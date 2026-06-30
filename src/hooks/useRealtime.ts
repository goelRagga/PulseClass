import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Handler = (payload: Record<string, unknown>) => void

export function useRealtimeSession(
  sessionId: string | null,
  handlers: {
    onStepAdvance?: Handler
    onLiveEvent?: Handler
    onParticipantJoined?: Handler
    onResponse?: Handler
    onSessionEnded?: Handler
  }
) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    if (!sessionId || !supabase) return
    const sb = supabase

    const channel = sb
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (row.status === 'ended') {
            ref.current.onSessionEnded?.(row)
          } else {
            ref.current.onStepAdvance?.(row)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_events', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          ref.current.onLiveEvent?.(payload.new as Record<string, unknown>)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => ref.current.onParticipantJoined?.(payload.new as Record<string, unknown>)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'responses' },
        (payload) => ref.current.onResponse?.(payload.new as Record<string, unknown>)
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [sessionId])
}