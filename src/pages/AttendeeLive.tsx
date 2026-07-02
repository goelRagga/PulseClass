import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo, LiveDot, ProgressBar } from '@/components/ui'
import { useAttendeeStore } from '@/stores'
import { useRealtimeSession } from '@/hooks/useRealtime'
import { api } from '@/lib/api'
import type { WorkshopStep } from '@/types'

// ── Option button ─────────────────────────────────────────────────
function OptionBtn({ label, text, state, onClick }: {
  label: string; text: string
  state: 'default' | 'selected' | 'correct' | 'wrong' | 'dim'
  onClick?: () => void
}) {
  const styles = {
    default:  'opt-default',
    selected: 'opt-selected',
    correct:  'opt-correct',
    wrong:    'opt-wrong',
    dim:      'opt-dim',
  }
  return (
    <button className={styles[state]} onClick={onClick} disabled={state !== 'default'}>
      <span className={clsx(
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
        state === 'correct'  ? 'bg-emerald-100 text-emerald-700' :
        state === 'wrong'    ? 'bg-red-100 text-red-600' :
        state === 'selected' ? 'bg-[#e1e0ff] text-[#4648d4]' :
                               'bg-gray-100 text-gray-500'
      )}>{label}</span>
      <span className="flex-1 text-left">{text}</span>
      {state === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
    </button>
  )
}

// ── Slide view ────────────────────────────────────────────────────
function SlideView({ step }: { step: WorkshopStep }) {
  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] border border-[#4648d4]/20 text-[#4648d4] text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4648d4] animate-pulse" /> Now presenting
        </span>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{step.title}</h2>
      </div>
      <div className="space-y-3">
        {(step.talking_points || []).map((pt, i) => (
          <div key={i} className="flex gap-3 p-4 bg-white/85 border border-slate-200/80 rounded-2xl shadow-sm backdrop-blur-xl animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-6 h-6 rounded-lg bg-[#eff4ff] border border-[#4648d4]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-[#4648d4]">{i + 1}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{pt}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Interaction view ──────────────────────────────────────────────
function InteractionView({ step, myAnswer, onAnswer }: {
  step: WorkshopStep; myAnswer?: number; onAnswer: (i: number) => void
}) {
  const isPoll = step.type === 'poll'
  const isQuiz = step.type === 'quiz'
  const hasAnswered = myAnswer !== undefined

  return (
    <div className="animate-slide-up">
      <div className={clsx('p-4 rounded-3xl border mb-5 shadow-sm',
        isPoll ? 'bg-[#eff4ff]/80 border-[#4648d4]/20' : 'bg-[#e9ddff]/80 border-[#6b38d4]/20'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <span className={clsx('badge', isPoll ? 'badge-poll' : 'badge-quiz')}>
            {isPoll ? 'Poll' : 'Quiz'}
          </span>
          {isQuiz && !hasAnswered && <span className="text-xs text-gray-500">Pick the correct answer</span>}
        </div>
        <p className="text-base font-bold text-gray-900 leading-snug">{step.question}</p>
      </div>

      <div className="space-y-2.5">
        {(step.options || []).map((opt, i) => {
          let state: 'default' | 'selected' | 'correct' | 'wrong' | 'dim' = 'default'
          if (hasAnswered) {
            const isCorrectOpt = isQuiz && i === step.correct_answer
            if (isCorrectOpt) state = 'correct'
            else if (i === myAnswer) state = isQuiz ? 'wrong' : 'selected'
            else state = 'dim'
          }
          return <OptionBtn key={i} label={String.fromCharCode(65 + i)} text={opt} state={state}
            onClick={() => !hasAnswered && onAnswer(i)} />
        })}
      </div>

      {hasAnswered && (
        <div className="mt-4 animate-scale-in">
          {isQuiz && (
            <div className={clsx('p-4 rounded-xl border-2',
              myAnswer === step.correct_answer ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}>
              <p className={clsx('text-sm font-bold mb-1',
                myAnswer === step.correct_answer ? 'text-emerald-700' : 'text-red-600'
              )}>
                {myAnswer === step.correct_answer ? '✅ Correct!' : '❌ Not quite'}
              </p>
              {step.explanation && <p className="text-xs text-gray-600 leading-relaxed">{step.explanation}</p>}
            </div>
          )}
          {isPoll && (
            <p className="text-center text-sm text-gray-400 py-3">
              Response recorded. Waiting for host to advance.
            </p>
          )}
          {isQuiz && <p className="text-center text-xs text-gray-400 mt-2">Waiting for host to advance.</p>}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function AttendeeLive() {
  const nav = useNavigate()
  const { sessionId, workshop, currentStep, myAnswers, currentEventId,
    setCurrentStep, submitAnswer, participantId, roomCode } = useAttendeeStore()

  const [ended, setEnded] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const eventIdRef = useRef<string>('')
  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep
  useEffect(() => { if (currentEventId) eventIdRef.current = currentEventId }, [currentEventId])

  useEffect(() => { if (!sessionId) nav('/join') }, [sessionId, nav])

  const syncStep = useCallback(async () => {
    if (!roomCode) return
    setSyncing(true)
    try {
      const s = await api.getSessionByCode(roomCode) as any
      if (s.status === 'ended') { setEnded(true); return }
      if (s.last_event_id) eventIdRef.current = s.last_event_id
      const newIdx = Number(s.current_step_index)
      if (newIdx !== currentStepRef.current) setCurrentStep(newIdx, eventIdRef.current)
    } catch { /* */ } finally { setSyncing(false) }
  }, [roomCode, setCurrentStep])

  useRealtimeSession(sessionId, {
    onStepAdvance: (row) => {
      if (row.status === 'ended') { setEnded(true); return }
      const newIdx = Number(row.current_step_index)
      if (newIdx !== currentStepRef.current) setCurrentStep(newIdx, eventIdRef.current)
    },
    onLiveEvent: (row) => {
      const evId = String(row.id || '')
      const newIdx = Number(row.step_index)
      if (evId) eventIdRef.current = evId
      if (newIdx !== currentStepRef.current) setCurrentStep(newIdx, evId)
    },
    onSessionEnded: () => setEnded(true),
  })

  useEffect(() => {
    const iv = setInterval(syncStep, 3000)
    return () => clearInterval(iv)
  }, [syncStep])

  const handleAnswer = async (optionIdx: number) => {
    if (!sessionId || !participantId) return
    const step = workshop?.steps[currentStep]
    const isCorrect = step?.type === 'quiz' ? optionIdx === step.correct_answer : undefined
    submitAnswer(currentStep, optionIdx)
    const evId = eventIdRef.current
    console.log('[IntelliMeet] answer submit', { evId, optionIdx })
    if (evId) {
      try {
        await api.submitAnswer(sessionId, { event_id: evId, participant_id: participantId, answer: String(optionIdx), is_correct: isCorrect })
      } catch (e) { console.error('[IntelliMeet] submit failed:', e) }
    } else {
      console.warn('[IntelliMeet] no event_id. Host must click Next first')
    }
  }

  const steps = workshop?.steps || []
  const currentStepData = steps[currentStep] as WorkshopStep | undefined
  const myAnswer = myAnswers[currentStep]
  const quizSteps = steps.filter(s => s.type === 'quiz')
  const correctCount = quizSteps.filter(s => myAnswers[steps.indexOf(s)] === s.correct_answer).length

  if (ended) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-10 shadow-[0_4px_6px_rgba(99,102,241,0.05),0_10px_15px_rgba(99,102,241,0.08)] animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4648d4] mb-2">Session ended</p>
          <h2 className="text-[22px] font-bold text-slate-900 mb-1">Session complete</h2>
          <p className="text-[13px] text-slate-500 mb-7">Great work participating.</p>
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { label: 'Answered', value: Object.keys(myAnswers).length },
              { label: 'Score', value: `${correctCount}/${quizSteps.length}` },
              { label: 'Accuracy', value: quizSteps.length > 0 ? `${Math.round(correctCount / quizSteps.length * 100)}%` : '-' },
            ].map(s => (
              <div key={s.label} className="bg-[#eff4ff] border border-[#4648d4]/15 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#4648d4]">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => nav('/')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white py-3 rounded-xl text-[14px] font-semibold shadow-[0_8px_24px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col max-w-lg mx-auto">
      {/* Top bar */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg">
            <LiveDot /><span className="text-xs font-bold text-red-600">LIVE</span>
          </div>
          <div
            className={clsx('w-2 h-2 rounded-full transition-all', syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')}
            title={syncing ? 'Syncing…' : 'Live'}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3">
        <ProgressBar value={currentStep} max={steps.length} />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs font-medium text-slate-500">Step {currentStep + 1} of {steps.length}</p>
          {quizSteps.length > 0 && (
            <p className="text-xs font-medium text-[#4648d4]">Score: {correctCount}/{quizSteps.length}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5">
        {!currentStepData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#e1e0ff] border border-[#4648d4]/20 flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 text-[#4648d4] animate-spin" />
            </div>
            <p className="text-sm text-slate-500">Waiting for host to start…</p>
          </div>
        ) : currentStepData.type === 'slide'
          ? <SlideView step={currentStepData} />
          : <InteractionView step={currentStepData} myAnswer={myAnswer} onAnswer={handleAnswer} />
        }
      </div>

      {/* Bottom status */}
      <div className="bg-white/70 backdrop-blur-xl border-t border-slate-200/80 py-3 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-xs text-slate-400">Synced with host · auto-updating</p>
      </div>
    </div>
  )
}
