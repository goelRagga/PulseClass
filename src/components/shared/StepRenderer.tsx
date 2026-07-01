import { clsx } from 'clsx'
import type { WorkshopStep } from '@/types'
import { Badge, Card } from '@/components/ui'
import { CheckCircle2, XCircle } from 'lucide-react'

interface StepRendererProps {
  step: WorkshopStep; stepNumber: number; totalSteps: number
  mode: 'host' | 'attendee'; myAnswer?: number; onAnswer?: (i: number) => void
}

export function StepRenderer({ step, stepNumber, totalSteps, mode, myAnswer, onAnswer }: StepRendererProps) {
  if (step.type === 'slide') {
    return (
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="slide">Slide</Badge>
          <span className="text-xs text-gray-400">{stepNumber} of {totalSteps}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h2>
        {step.talking_points?.length && (
          <ul className="space-y-3">
            {step.talking_points.map((pt, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
                {pt}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const isPoll = step.type === 'poll'
  const isQuiz = step.type === 'quiz'
  const hasAnswered = myAnswer !== undefined
  const isCorrect = isQuiz && hasAnswered && myAnswer === step.correct_answer

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={step.type}>{isPoll ? 'Poll' : 'Quiz'}</Badge>
        <span className="text-xs text-gray-400">{stepNumber} of {totalSteps}</span>
        {mode === 'attendee' && hasAnswered && (
          isCorrect
            ? <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Correct!</span>
            : isQuiz ? <span className="ml-auto flex items-center gap-1 text-xs text-red-500 font-semibold"><XCircle className="w-3.5 h-3.5" /> Not quite</span> : null
        )}
      </div>

      <p className="text-base font-bold text-gray-900 mb-4">{step.question}</p>

      <div className="space-y-2">
        {step.options?.map((option, i) => {
          const isMyAnswer = myAnswer === i
          const isCorrectOption = isQuiz && i === step.correct_answer
          let cls = 'opt-default'
          if (hasAnswered) {
            if (isQuiz) {
              if (isCorrectOption) cls = 'opt-correct'
              else if (isMyAnswer) cls = 'opt-wrong'
              else cls = 'opt-dim'
            } else {
              if (isMyAnswer) cls = 'opt-selected'
              else cls = 'opt-dim'
            }
          }
          const canClick = mode === 'attendee' && !hasAnswered
          return (
            <button key={i} className={cls} onClick={() => canClick && onAnswer?.(i)} disabled={!canClick}>
              <span className={clsx(
                'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                isQuiz && hasAnswered && isCorrectOption ? 'bg-emerald-100 text-emerald-700' :
                isMyAnswer && !isCorrectOption && isQuiz ? 'bg-red-100 text-red-600' :
                isMyAnswer && isPoll ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          )
        })}
      </div>

      {mode === 'host' && isQuiz && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          Correct: <span className="font-semibold text-emerald-600">{step.options?.[step.correct_answer ?? 0]}</span>
          {step.explanation && <span className="ml-2 text-gray-400">Reason: {step.explanation}</span>}
        </div>
      )}
    </div>
  )
}
