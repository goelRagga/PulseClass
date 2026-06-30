import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft, Radio, Copy, Check } from 'lucide-react'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import type { Session } from '@/types'

export default function HostSetup() {
  const nav = useNavigate()
  const { workshopId } = useParams()
  const { workshop, setSession, hostId } = useHostStore()
  const [session, setLocalSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!workshopId) return
    api.startSession(workshopId, hostId)
      .then(s => { setLocalSession(s as Session); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : 'Failed'); setLoading(false) })
  }, [workshopId, hostId])

  const launch = async () => {
    if (!session) return
    setLaunching(true)
    try {
      await api.setLive(session.id)
      setSession({ ...session, status: 'live' })
      nav(`/host/live/${session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to launch')
      setLaunching(false)
    }
  }

  const copy = () => {
    if (session?.room_code) {
      navigator.clipboard.writeText(session.room_code)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-150 shadow-sm px-6 py-4 flex items-center justify-between">
        <Logo />
        <button onClick={() => nav('/host/create')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        {loading ? (
          <div className="text-center"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" /><p className="text-sm text-gray-500">Creating session…</p></div>
        ) : error ? (
          <div className="text-center max-w-sm"><p className="text-red-600 text-sm mb-4">{error}</p><button onClick={() => nav('/host/create')} className="btn-secondary">Go back</button></div>
        ) : session && (
          <div className="max-w-md w-full animate-slide-up">
            <div className="bg-white border border-gray-150 rounded-3xl shadow-card-lg p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto mb-5">
                <Radio className="w-8 h-8 text-brand-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Ready to go live</h1>
              <p className="text-sm text-gray-500 mb-8">Share this code with your attendees before you start.</p>

              <div className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-6 mb-5">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Room code</p>
                <div className="font-mono text-4xl font-bold tracking-[0.35em] text-brand-700 mb-3">{session.room_code}</div>
                <button onClick={copy} className="btn-ghost text-sm mx-auto">
                  {copied ? <><Check className="w-4 h-4 text-emerald-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy code</>}
                </button>
              </div>

              {workshop && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Workshop</p>
                  <p className="text-sm font-semibold text-gray-800">{workshop.content.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{workshop.content.steps.length} steps · {workshop.content.estimated_duration_minutes} min</p>
                </div>
              )}

              <button onClick={launch} disabled={launching} className="btn-primary w-full py-3 justify-center text-base">
                {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                {launching ? 'Launching…' : 'Start session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}