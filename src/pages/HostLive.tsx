import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Users, BarChart3, Monitor, Square, TrendingUp, CheckCircle, Copy, Check } from 'lucide-react'
import { Logo, Badge, LiveDot, StatCard, ProgressBar, Card, EmptyState } from '@/components/ui'
import { StepRenderer } from '@/components/shared/StepRenderer'
import { ResultsCard } from '@/components/shared/LiveBarChart'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import { useRealtimeSession } from '@/hooks/useRealtime'
import type { Dashboard } from '@/types'
import { clsx } from 'clsx'

type Tab = 'slide' | 'dashboard'

export default function HostLive() {
  const nav = useNavigate()
  const { sessionId } = useParams()
  const { workshop, session, currentStep, setCurrentStep } = useHostStore()

  const [tab, setTab] = useState<Tab>('slide')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [advancing, setAdvancing] = useState(false)
  const [ended, setEnded] = useState(false)
  const [copied, setCopied] = useState(false)

  const participantCount = dashboard?.participant_count ?? 0
  const steps = workshop?.content.steps || []
  const contentType = workshop?.content.metadata?.mode || 'content'
  const currentStepData = steps[currentStep]
  const isLastStep = currentStep >= steps.length - 1

  const fetchDashboard = useCallback(async () => {
    if (!sessionId) return
    try { const d = await api.getDashboard(sessionId) as Dashboard; setDashboard(d) }
    catch { /* silent */ }
  }, [sessionId])

  useEffect(() => {
    fetchDashboard()
    const iv = setInterval(fetchDashboard, 2000)
    return () => clearInterval(iv)
  }, [fetchDashboard])

  useRealtimeSession(sessionId || null, {
    onParticipantJoined: () => fetchDashboard(),
    onResponse: () => fetchDashboard(),
    onSessionEnded: () => setEnded(true),
  })

  const advance = async () => {
    if (!sessionId || advancing) return
    setAdvancing(true)
    try {
      const res = await api.nextStep(sessionId) as { step_index: number; status: string }
      setCurrentStep(res.step_index)
      if (res.status === 'ended') setEnded(true)
      setTimeout(fetchDashboard, 500)
    } finally { setAdvancing(false) }
  }

  const endSession = async () => {
    if (!sessionId) return
    await api.endSession(sessionId)
    setEnded(true)
  }

  const copyCode = () => {
    if (session?.room_code) {
      navigator.clipboard.writeText(session.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (ended) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm glass-panel p-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Session complete</h2>
          <p className="text-sm text-gray-500 mb-6">{participantCount} attendees · {steps.length} steps</p>
          <button onClick={() => nav('/')} className="btn-primary w-full justify-center py-3">Back to home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="glass-panel border-x-0 border-t-0 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
              <LiveDot /><span className="text-xs font-bold text-red-600">LIVE</span>
            </div>
            {session && (
              <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-slate-200/80 rounded-2xl hover:bg-white transition-all backdrop-blur-xl">
                <span className="font-mono font-bold text-sm tracking-widest text-brand-600">{session.room_code}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-slate-200/80 rounded-2xl backdrop-blur-xl">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-bold text-gray-700">{participantCount}</span>
            </div>
            <button onClick={endSession} className="btn-danger btn-sm">
              <Square className="w-3.5 h-3.5" /> End
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 w-full flex-1 flex flex-col gap-5">
        {/* Progress */}
        <div className="card px-5 py-4">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round((currentStep / Math.max(steps.length - 1, 1)) * 100)}% complete</span>
          </div>
          <ProgressBar value={currentStep} max={Math.max(steps.length - 1, 1)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Attendees" value={participantCount} icon={Users} />
          <StatCard label="Step" value={`${currentStep + 1}/${steps.length}`} icon={Monitor} />
          <StatCard label="Responses" value={dashboard?.total_responses || 0} icon={TrendingUp} />
          <StatCard
            label="Accuracy" icon={CheckCircle}
            value={dashboard?.overall_accuracy ? `${dashboard.overall_accuracy}%` : '-'}
            color={dashboard?.overall_accuracy
              ? dashboard.overall_accuracy >= 70 ? 'text-emerald-600'
              : dashboard.overall_accuracy >= 40 ? 'text-amber-600' : 'text-red-500'
              : 'text-gray-900'}
          />
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'slide' as Tab, label: 'Current step', icon: Monitor },
              { id: 'dashboard' as Tab, label: 'Live results', icon: BarChart3,
                badge: dashboard?.total_responses || 0 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-2',
                  tab === t.id
                    ? 'border-brand-500 text-brand-600 bg-brand-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'slide' && (
              <div>
                {currentStepData
                  ? <StepRenderer step={currentStepData} stepNumber={currentStep + 1} totalSteps={steps.length} mode="host" />
                  : <div className="text-center py-8 text-gray-400 text-sm">{contentType.charAt(0).toUpperCase() + contentType.slice(1)} complete</div>
                }
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Badge variant={currentStepData?.type || 'slide'}>{currentStepData?.type || 'done'}</Badge>
                    {currentStepData?.type !== 'slide' && dashboard && (
                      <span className="text-xs text-gray-400">
                        {dashboard.step_results.find(r => r.step_index === currentStep)?.total_responses || 0} responses
                      </span>
                    )}
                  </div>
                  <button onClick={advance} disabled={advancing || isLastStep} className="btn-primary">
                    {advancing ? 'Advancing…' : isLastStep ? 'Last step' : 'Next'}
                    {!advancing && !isLastStep && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === 'dashboard' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.18em]">Live responses</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Refreshing every 2s
                  </div>
                </div>
                {dashboard?.step_results?.length
                  ? <div className="space-y-4">{dashboard.step_results.map((r, i) =>
                      <ResultsCard key={i} result={r} highlight={r.step_index === currentStep} />)}</div>
                  : <EmptyState icon={BarChart3} title="No responses yet"
                      description="Advance to a poll or quiz. Answers appear here in real time." />
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
