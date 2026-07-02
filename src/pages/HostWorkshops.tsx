import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, BookOpen, BarChart3, Settings,
  RefreshCw, Plus, Bell, HelpCircle, Radio, Layers,
  FileText, Clock, Loader2, Search, Info, Pencil,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { HostBreadcrumbs } from '@/components/host/HostHeader'
import { api } from '@/lib/api'
import { useAuthStore, useHostStore } from '@/stores'
import type { Workshop, WorkshopContent, WorkshopStep } from '@/types'

interface WorkshopMeta { id: string; topic: string; level: string; created_at: string; content?: WorkshopContent }

// ── Type config ────────────────────────────────────────────────────────────────
const STEP_TYPE = {
  slide: { pill: 'bg-[#e1e0ff] text-[#2f2ebe]', icon: FileText,   label: 'SLIDE' },
  poll:  { pill: 'bg-[#e9ddff] text-[#5516be]', icon: BarChart3,  label: 'POLL'  },
  quiz:  { pill: 'bg-[#ffdcc5] text-[#703700]', icon: HelpCircle, label: 'QUIZ'  },
}

function formatCreated(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Sidebar nav item ───────────────────────────────────────────────────────────
function NavItem({ label, icon: Icon, active, onClick }: {
  label: string; icon: React.ElementType; active?: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all',
        active ? 'bg-[#8455ef] text-white shadow-md' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
      )}
    >
      <Icon className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400')} />
      <span>{label}</span>
    </button>
  )
}

// ── Step card ──────────────────────────────────────────────────────────────────
function StepCard({ step, index, total }: { step: WorkshopStep; index: number; total: number }) {
  const cfg = STEP_TYPE[step.type]
  const Icon = cfg.icon
  const isLastOdd = index === total - 1 && total % 2 !== 0

  return (
    <div
      className={clsx(
        'bg-white border border-slate-200/80 rounded-2xl p-7 flex gap-5',
        'shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_15px_rgba(99,102,241,0.04)]',
        'hover:-translate-y-0.5 transition-transform duration-300 ease-out',
        isLastOdd && 'lg:col-span-2'
      )}
    >
      {/* Step number + icon column */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-1 w-9">
        <span className="text-[28px] font-bold text-slate-200 leading-none tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <Icon className="h-5 w-5 text-slate-300 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={clsx('px-2.5 py-0.5 text-[10px] font-bold rounded-full mb-3 inline-block uppercase tracking-wide', cfg.pill)}>
          {cfg.label}
        </span>
        <h4 className="text-[17px] font-bold text-slate-900 mb-4 leading-snug">
          {step.type === 'slide' ? step.title : step.question}
        </h4>
        {step.type === 'slide' && step.talking_points?.length ? (
          <ul className={clsx(
            'gap-y-2.5',
            isLastOdd ? 'grid grid-cols-1 md:grid-cols-2 gap-x-10' : 'space-y-2.5'
          )}>
            {step.talking_points.map((pt, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] text-slate-500 leading-relaxed">
                <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#4648d4] flex-shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        ) : step.type !== 'slide' && step.options?.length ? (
          <div className="space-y-2">
            {step.options.map((opt, i) => {
              const isCorrect = step.type === 'quiz' && step.correct_answer === i
              return (
                <div
                  key={i}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl border text-[13px] font-medium flex items-center justify-between gap-4',
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                      : 'bg-[#e5eeff] border-[#c7c4d7]/40 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0 shadow-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isCorrect && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex-shrink-0">
                      Correct
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HostWorkshops() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { hostId, setWorkshop } = useHostStore()
  const [workshops, setWorkshops] = useState<WorkshopMeta[]>([])
  const [selected, setSelected] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [query, setQuery] = useState('')

  const userName = user?.display_name || (user as any)?.name || 'Host'

  const loadList = () => {
    setLoading(true)
    api.listWorkshops(hostId)
      .then(d => {
        const rows = d as WorkshopMeta[]
        setWorkshops(rows)
        if (rows[0] && !selected) selectWorkshop(rows[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [hostId])

  const selectWorkshop = async (id: string) => {
    setDetailLoading(true)
    try { setSelected(await api.getWorkshop(id) as Workshop) }
    finally { setDetailLoading(false) }
  }

  const launch = () => {
    if (!selected) return
    setWorkshop(selected)
    nav(`/host/setup/${selected.id}`)
  }

  const filtered = workshops.filter(w =>
    w.topic.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f8f9ff]">

      {/* ── Fixed sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/80 py-6 px-4 z-50 shrink-0">
        <div className="px-2 mb-8">
          <Logo size="md" />
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem label="Dashboard"  icon={LayoutDashboard} onClick={() => nav('/host/dashboard')} />
          <NavItem label="Sessions Library"    icon={BookOpen}        active onClick={() => {}} />
          {/* <NavItem label="Analytics"  icon={BarChart3}       onClick={() => {}} />
          <NavItem label="Settings"   icon={Settings}        onClick={() => {}} /> */}
        </nav>
        <div className="mt-auto p-3.5 bg-white/60 rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4648d4] to-[#6b38d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {userName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 truncate">{userName.toUpperCase()}</p>
              <p className="text-[11px] font-medium text-slate-400">Host</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <label className="relative hidden lg:flex items-center w-96">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search sessions, resources..."
                className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-slate-200/70 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all"
              />
            </label>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadList}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200/80 text-[#4648d4] font-bold text-[13px] rounded-lg hover:bg-[#eff4ff] transition-all active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => nav('/host/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white rounded-lg text-[13px] font-bold shadow-[0_4px_14px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
            <div className="flex items-center gap-1 border-l border-slate-200/80 pl-3 ml-1">
              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                <Bell className="h-4 w-4" />
              </button>
              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="shrink-0 px-8 py-3 border-b border-slate-200/60 bg-white/40">
          <HostBreadcrumbs
            items={[
              { label: 'Dashboard', to: '/host/dashboard' },
              { label: 'Sessions' },
            ]}
          />
        </div>

        {/* Body: list panel + detail area */}
        <div className="flex flex-1 overflow-hidden">

          {/* Session list panel */}
          <aside className="w-[272px] border-r border-slate-200/80 bg-white/60 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[13px] font-bold text-slate-900">All sessions</p>
                  <p className="text-[11px] text-slate-400">{workshops.length} saved</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#eff4ff] border border-[#c0c1ff]/40 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-[#4648d4]" />
                </div>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-[9px]" />
                <input
                  className="w-full bg-white border border-slate-200/80 rounded-lg pl-9 pr-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search sessions"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-8 px-4">
                {query ? 'No matching sessions' : 'No sessions yet'}
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {filtered.map(w => (
                  <button
                    key={w.id}
                    onClick={() => selectWorkshop(w.id)}
                    className={clsx(
                      'w-full text-left rounded-xl border p-3.5 transition-all',
                      selected?.id === w.id
                        ? 'bg-[#eff4ff] border-[#c0c1ff]/60 shadow-sm'
                        : 'bg-white/80 border-transparent hover:border-slate-200 hover:bg-white'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={clsx(
                        'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                        w.content?.metadata?.mode === 'workshop'
                          ? 'bg-[#e9ddff] text-[#5516be]'
                          : 'bg-[#e1e0ff] text-[#2f2ebe]'
                      )}>
                        {w.content?.metadata?.mode || 'webinar'}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-[#e5eeff] text-[#4648d4]">
                        {w.level}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">{w.topic}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(w.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* ── Detail area ── */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
              </div>
            ) : !selected ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Layers className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-[15px] font-semibold text-slate-500">Select a session</p>
                <p className="text-[13px] text-slate-400 mt-1">The full session outline will appear here.</p>
              </div>
            ) : (
              <>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-10 py-8">
                  <div className="max-w-[900px] mx-auto">

                    {/* Session header card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_15px_rgba(99,102,241,0.05)]">
                      {/* Atmospheric blob */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#4648d4]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                      <div className="relative">
                        {/* Badges row + launch button */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-[#e5eeff] text-[#4648d4] text-[10px] font-bold uppercase rounded-full border border-[#4648d4]/20">
                              {selected.content.metadata?.mode || 'webinar'}
                            </span>
                            <span className="px-3 py-1 bg-[#e9ddff] text-[#5516be] text-[10px] font-bold uppercase rounded-full">
                              {selected.level}
                            </span>
                            <span className="text-[12px] text-slate-400 flex items-center gap-1.5 ml-2">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Created {formatCreated(selected.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={launch}
                            className="flex items-center gap-2.5 px-6 py-3 bg-[#4648d4] text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all text-[13px] shrink-0"
                          >
                            <Radio className="h-4 w-4" />
                            Launch {selected.content.metadata?.mode || 'workshop'}
                          </button>
                        </div>
                        {/* Title */}
                        <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-2">
                          {selected.content.title}
                        </h1>
                        {/* Topic / description */}
                        <p className="text-[14px] text-slate-500 leading-relaxed max-w-2xl">
                          {selected.topic}
                        </p>
                      </div>

                      {/* Metric tiles */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                        {[
                          { label: 'Total steps', value: selected.content.steps.length,                                    icon: Layers   },
                          { label: 'Slides',      value: selected.content.steps.filter(s => s.type === 'slide').length,   icon: FileText },
                          { label: 'Polls',       value: selected.content.steps.filter(s => s.type === 'poll').length,    icon: BarChart3 },
                          { label: 'Quizzes',     value: selected.content.steps.filter(s => s.type === 'quiz').length,    icon: HelpCircle },
                          { label: 'Duration',    value: `${selected.content.estimated_duration_minutes}m`,               icon: Clock    },
                        ].map(stat => (
                          <div key={stat.label} className="bg-[#eff4ff] p-4 rounded-xl border border-[#c7c4d7]/30 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#dce9ff] flex items-center justify-center text-[#4648d4] shrink-0">
                              <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[22px] font-bold text-slate-900 leading-none">{stat.value}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session outline header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-[0.12em]">
                          Session Outline
                        </h3>
                        <p className="text-[13px] text-slate-400 mt-0.5">
                          Review slides, polls, quiz options, and correct answers.
                        </p>
                      </div>
                      {/* <button
                        onClick={() => nav('/host/create')}
                        className="flex items-center gap-1.5 text-[#4648d4] font-bold text-[13px] hover:underline underline-offset-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Outline
                      </button> */}
                    </div>

                    {/* Step cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                      {selected.content.steps.map((s, i) => (
                        <StepCard key={i} step={s} index={i} total={selected.content.steps.length} />
                      ))}
                    </div>

                  </div>
                </div>

                {/* Footer */}
                <footer className="shrink-0 px-10 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[13px] text-slate-500">
                    <Info className="h-4 w-4 text-[#4648d4] shrink-0" />
                    Ready to launch. All steps verified.
                  </div>
                  <div className="flex items-center gap-3">
                    {/* <button className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                      Save as Draft
                    </button> */}
                    <button
                      onClick={launch}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#4648d4] text-white font-bold text-[13px] rounded-xl shadow-[0_4px_14px_rgba(70,72,212,0.25)] hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Radio className="h-3.5 w-3.5" />
                      Launch Now
                    </button>
                  </div>
                </footer>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
