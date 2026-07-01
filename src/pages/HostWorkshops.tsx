import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Radio, Clock, Loader2, BookOpen, Layers, HelpCircle, ListChecks, Search, FileText } from 'lucide-react'
import { Logo, Badge, EmptyState } from '@/components/ui'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import type { Workshop, WorkshopContent, WorkshopStep } from '@/types'
import { clsx } from 'clsx'

interface WorkshopMeta { id: string; topic: string; level: string; created_at: string; content?: WorkshopContent }

const stepIcon = {
  slide: FileText,
  poll: ListChecks,
  quiz: HelpCircle,
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function StepPreview({ step, index }: { step: WorkshopStep; index: number }) {
  const Icon = stepIcon[step.type]
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-center flex-shrink-0 backdrop-blur-xl">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-gray-300">{String(index + 1).padStart(2, '0')}</span>
            <Badge variant={step.type}>{step.type}</Badge>
          </div>
          <h3 className="text-sm font-bold text-gray-900 leading-snug">
            {step.type === 'slide' ? step.title : step.question}
          </h3>
          {step.type === 'slide' && step.talking_points?.length ? (
            <ul className="mt-3 space-y-1.5">
              {step.talking_points.slice(0, 3).map((point, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-500">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {step.type !== 'slide' && step.options?.length ? (
            <div className="mt-3 grid gap-1.5">
              {step.options.map((option, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs',
                    step.type === 'quiz' && step.correct_answer === i
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-gray-150 bg-gray-50 text-gray-500'
                  )}
                >
                  <span className="font-mono font-bold">{String.fromCharCode(65 + i)}</span>
                  <span className="truncate">{option}</span>
                  {step.type === 'quiz' && step.correct_answer === i && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">Correct</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function HostWorkshops() {
  const nav = useNavigate()
  const { hostId, setWorkshop } = useHostStore()
  const [workshops, setWorkshops] = useState<WorkshopMeta[]>([])
  const [selected, setSelected] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.listWorkshops(hostId)
      .then(d => {
        const rows = d as WorkshopMeta[]
        setWorkshops(rows)
        if (rows[0]) selectWorkshop(rows[0].id)
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [hostId])

  const selectWorkshop = async (id: string) => {
    setDetailLoading(true)
    try { setSelected(await api.getWorkshop(id) as Workshop) }
    finally { setDetailLoading(false) }
  }

  const launch = () => { if (!selected) return; setWorkshop(selected); nav(`/host/setup/${selected.id}`) }
  const timeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (m < 60) return `${m}m ago`; const h = Math.floor(m/60)
    if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`
  }
  const filtered = workshops.filter(w => w.topic.toLowerCase().includes(query.trim().toLowerCase()))
  const selectedStats = selected ? {
    steps: selected.content.steps.length,
    slides: selected.content.steps.filter(s => s.type === 'slide').length,
    polls: selected.content.steps.filter(s => s.type === 'poll').length,
    quizzes: selected.content.steps.filter(s => s.type === 'quiz').length,
  } : null

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        <div className="flex gap-2">
          <button onClick={() => nav('/host/create')} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> New session</button>
          <button onClick={() => nav('/host/dashboard')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] w-full">
        <aside className="bg-white/85 backdrop-blur-xl border-r border-slate-200/70 flex flex-col min-h-[calc(100vh-65px)]">
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h1 className="text-base font-bold text-gray-900">Session library</h1>
                <p className="text-xs text-gray-400 mt-0.5">{workshops.length} saved sessions</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand-600" />
              </div>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-300 absolute left-3 top-2.5" />
              <input
                className="input pl-9 py-2"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search sessions"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
          ) : workshops.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No sessions yet"
              description="Create a webinar or workshop session and it will appear in this library."
              imageSrc="https://res.cloudinary.com/dvbdvkhs/image/upload/v1782943849/lucid-origin_Minimal_premium_illustration_for_an_intelligent_meeting_session_platform_floatin-0_qmeslc.jpg"
              imageAlt="Session placeholder illustration"
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filtered.map(w => (
                <button key={w.id} onClick={()=>selectWorkshop(w.id)}
                  className={clsx('w-full text-left rounded-2xl border p-3.5 transition-all',
                    selected?.id===w.id ? 'bg-brand-50 border-brand-200 shadow-sm' : 'bg-white/80 border-transparent hover:border-slate-200 hover:bg-white')}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={w.content?.metadata?.mode === 'workshop' ? 'success' : 'slide'}>
                      {w.content?.metadata?.mode || 'webinar'}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-2">{w.topic}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={w.level==='beginner'?'slide':w.level==='intermediate'?'poll':'quiz'}>{w.level}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(w.created_at)}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No matching sessions</p>
              )}
            </div>
          )}
        </aside>

        <main className="min-w-0 px-4 py-5 lg:px-8 lg:py-7">
          {detailLoading && <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>}
          {!detailLoading && !selected && (
            <div className="card min-h-[420px] flex flex-col items-center justify-center text-center">
              <Layers className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Select a session</p>
              <p className="text-xs text-gray-400 mt-1">The full session outline will appear here.</p>
            </div>
          )}
          {!detailLoading && selected && (
            <div className="animate-slide-up max-w-6xl mx-auto">
              <div className="card p-5 lg:p-6 mb-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={selected.content.metadata?.mode === 'workshop' ? 'success' : 'slide'}>{selected.content.metadata?.mode || 'webinar'}</Badge>
                      <Badge variant={selected.level==='beginner'?'slide':selected.level==='intermediate'?'poll':'quiz'}>{selected.level}</Badge>
                      <span className="text-xs text-gray-400">Created {formatDate(selected.created_at)}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{selected.content.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">{selected.topic}</p>
                  </div>
                  <button onClick={launch} className="btn-primary lg:flex-shrink-0 justify-center">
                    <Radio className="w-4 h-4" /> Launch {selected.content.metadata?.mode || 'webinar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                {[
                  { label:'Total steps', value: selectedStats?.steps, icon: Layers },
                  { label:'Slides', value: selectedStats?.slides, icon: FileText },
                  { label:'Polls', value: selectedStats?.polls, icon: ListChecks },
                  { label:'Quizzes', value: selectedStats?.quizzes, icon: HelpCircle },
                  { label:'Duration', value: `${selected.content.estimated_duration_minutes}m`, icon: Clock },
                ].map(stat=>(
                  <div key={stat.label} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                        <stat.icon className="w-4 h-4 text-brand-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Session outline</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Slides, polls, quiz options, and correct answers.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {selected.content.steps.map((s,i)=>(
                  <StepPreview key={i} step={s} index={i} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
