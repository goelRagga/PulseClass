import { clsx } from 'clsx'
import type { StepResult } from '@/types'

export function LiveBarChart({ result }: { result: StepResult }) {
  const max = Math.max(...result.options.map(o => o.count), 1)
  return (
    <div className="space-y-3">
      {result.options.map((opt, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-gray-600 truncate max-w-[65%]">
              <span className="font-mono font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>
              {opt.option}
              {opt.is_correct && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200">✓ correct</span>}
            </span>
            <span className="text-gray-500 font-semibold flex-shrink-0 ml-2">{opt.count} · {opt.pct}%</span>
          </div>
          <div className="h-7 bg-slate-100/90 rounded-2xl overflow-hidden ring-1 ring-slate-200/80">
            <div
              className={clsx('h-full rounded-2xl transition-all duration-700 ease-out',
                opt.is_correct ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand-500 via-indigo-500 to-violet-500'
              )}
              style={{ width: `${Math.round((opt.count / max) * 100)}%`, minWidth: opt.count > 0 ? '2rem' : '0' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ResultsCard({ result, highlight }: { result: StepResult; highlight?: boolean }) {
  return (
    <div className={clsx('card p-5 transition-all',
      highlight ? 'border-brand-300 ring-4 ring-brand-100/70' : 'border-slate-200/80'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={clsx('badge', result.type === 'quiz' ? 'badge-quiz' : 'badge-poll')}>
              {result.type === 'quiz' ? 'Quiz' : 'Poll'}
            </span>
            {highlight && (
              <span className="text-xs text-brand-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse inline-block" /> Current
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{result.question}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-gray-900">{result.total_responses}</p>
          <p className="text-xs text-gray-400">responses</p>
        </div>
      </div>
      <LiveBarChart result={result} />
      {result.type === 'quiz' && result.accuracy !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Class accuracy</span>
          <span className={clsx('text-sm font-bold',
            result.accuracy >= 70 ? 'text-emerald-600' :
            result.accuracy >= 40 ? 'text-amber-600' : 'text-red-500'
          )}>{result.accuracy}%</span>
        </div>
      )}
    </div>
  )
}
