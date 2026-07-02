import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Layers,
  Loader2,
  Plus,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Logo, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import type { CreationMode, Workshop, WorkshopStep } from '@/types'

type Screen = 'chooser' | 'form' | 'generating' | 'editor'

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
const TONES = ['conversational', 'professional', 'energetic'] as const
const DURATIONS = [15, 30, 45, 60, 90]
const WORKSHOP_TYPES = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'operations', label: 'Operations' },
  { value: 'supply_chain', label: 'Supply chain' },
  { value: 'technology', label: 'Technology' },
  { value: 'transformation', label: 'Transformation' },
  { value: 'risk', label: 'Risk' },
] as const

function StepEditor({ step, idx, total, onChange, onDelete, onMove }: {
  step: WorkshopStep
  idx: number
  total: number
  onChange: (s: WorkshopStep) => void
  onDelete: () => void
  onMove: (d: -1 | 1) => void
}) {
  const [open, setOpen] = useState(idx === 0)
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50/70" onClick={() => setOpen(o => !o)}>
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500 shrink-0">{idx + 1}</span>
        <Badge variant={step.type}>{step.type}</Badge>
        <span className="text-sm text-slate-700 flex-1 truncate font-medium min-w-0">
          {step.type === 'slide' ? step.title || 'Untitled' : step.question || 'Untitled'}
        </span>
        <div className="flex items-center gap-0.5 ml-auto shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3 bg-gradient-to-br from-slate-50/70 to-white animate-fade-in">
          {step.type === 'slide' && (
            <>
              <div><label className="label">Title</label><input className="input" value={step.title || ''} onChange={e => onChange({ ...step, title: e.target.value })} /></div>
              <div><label className="label">Talking points, one per line</label>
                <textarea className="input" rows={4} value={(step.talking_points || []).join('\n')} onChange={e => onChange({ ...step, talking_points: e.target.value.split('\n') })} /></div>
            </>
          )}
          {(step.type === 'poll' || step.type === 'quiz') && (
            <>
              <div><label className="label">Question</label><input className="input" value={step.question || ''} onChange={e => onChange({ ...step, question: e.target.value })} /></div>
              <div><label className="label">Options {step.type === 'quiz' && <span className="text-slate-400 normal-case font-normal">(click circle = correct)</span>}</label>
                <div className="space-y-2">
                  {(step.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      {step.type === 'quiz' && (
                        <button onClick={() => onChange({ ...step, correct_answer: oi })}
                          className={clsx('w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all', step.correct_answer === oi ? 'border-emerald-500 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/30' : 'border-slate-300 hover:border-emerald-400')} />
                      )}
                      <input className="input" value={opt} onChange={e => { const o = [...(step.options || [])]; o[oi] = e.target.value; onChange({ ...step, options: o }) }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                      <button onClick={() => onChange({ ...step, options: (step.options || []).filter((_, i) => i !== oi) })} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => onChange({ ...step, options: [...(step.options || []), ''] })} className="btn-ghost text-xs py-1.5"><Plus className="w-3.5 h-3.5" /> Add option</button>
                </div>
              </div>
              {step.type === 'quiz' && <div><label className="label">Explanation</label><textarea className="input" rows={2} value={step.explanation || ''} onChange={e => onChange({ ...step, explanation: e.target.value })} /></div>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function HostCreate() {
  const nav = useNavigate()
  const { setWorkshop, hostId } = useHostStore()
  const [screen, setScreen] = useState<Screen>('chooser')
  const [mode, setMode] = useState<CreationMode>('webinar')
  const [workshopStep, setWorkshopStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [workshop, setLocalWorkshop] = useState<Workshop | null>(null)
  const [steps, setSteps] = useState<WorkshopStep[]>([])
  const [webinarForm, setWebinarForm] = useState({
    topic: '',
    duration: 30,
    level: 'intermediate' as typeof LEVELS[number],
    tone: 'conversational' as typeof TONES[number],
  })
  const [workshopForm, setWorkshopForm] = useState({
    project_name: '',
    client_name: '',
    project_description: '',
    business_domain: '',
    workshop_type: 'strategy' as typeof WORKSHOP_TYPES[number]['value'],
    objective: '',
    duration: 60,
    level: 'intermediate' as typeof LEVELS[number],
    tone: 'professional' as typeof TONES[number],
    agenda: 'Intro and alignment (10 min)\nRoot-cause analysis (15 min)\nBrainstorm and prioritization (20 min)',
    discussion_topics: '',
    reference_document_name: '',
    reference_document_content: '',
  })

  const chooseMode = (nextMode: CreationMode) => {
    setMode(nextMode)
    setError('')
    setScreen('form')
  }

  const validateWorkshop = () => {
    if (!workshopForm.project_name.trim()) return 'Project name is required.'
    if (!workshopForm.project_description.trim()) return 'Project description is required.'
    if (!workshopForm.business_domain.trim()) return 'Business domain is required.'
    if (!workshopForm.objective.trim()) return 'Workshop objective is required.'
    return ''
  }

  const readReferenceFile = async (file: File) => {
    const text = await file.text()
    setWorkshopForm(f => ({
      ...f,
      reference_document_name: file.name,
      reference_document_content: text.slice(0, 12000),
    }))
  }

  const generate = async () => {
    setError('')
    const payload = mode === 'webinar'
      ? {
          ...webinarForm,
          topic: webinarForm.topic.trim(),
          mode,
          host_id: hostId,
        }
      : {
          topic: workshopForm.objective.trim() || workshopForm.project_name.trim(),
          duration: workshopForm.duration,
          level: workshopForm.level,
          tone: workshopForm.tone,
          mode,
          host_id: hostId,
          project_name: workshopForm.project_name.trim(),
          client_name: workshopForm.client_name.trim() || undefined,
          project_description: workshopForm.project_description.trim(),
          business_domain: workshopForm.business_domain.trim(),
          workshop_type: workshopForm.workshop_type,
          objective: workshopForm.objective.trim(),
          agenda: workshopForm.agenda.split('\n').map(s => s.trim()).filter(Boolean),
          discussion_topics: workshopForm.discussion_topics.split('\n').map(s => s.trim()).filter(Boolean),
          reference_document_name: workshopForm.reference_document_name || undefined,
          reference_document_content: workshopForm.reference_document_content || undefined,
        }

    if (mode === 'webinar' && !webinarForm.topic.trim()) { setError('Enter a webinar goal first.'); return }
    if (mode === 'workshop') {
      const validation = validateWorkshop()
      if (validation) { setError(validation); return }
    }

    setScreen('generating')
    try {
      const w = await api.generateWorkshop(payload) as Workshop
      setLocalWorkshop(w)
      setSteps(w.content.steps)
      setScreen('editor')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setScreen('form')
    }
  }

  const updateStep = (idx: number, updated: WorkshopStep) => setSteps(s => s.map((st, i) => i === idx ? updated : st))
  const deleteStep = (idx: number) => setSteps(s => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, index: i })))
  const moveStep = (idx: number, dir: -1 | 1) => setSteps(s => {
    const a = [...s], t = idx + dir
    if (t < 0 || t >= a.length) return a
    ;[a[idx], a[t]] = [a[t], a[idx]]
    return a.map((st, i) => ({ ...st, index: i }))
  })
  const addStep = (type: WorkshopStep['type']) => {
    const base = { index: steps.length, type }
    setSteps(s => [...s, type === 'slide'
      ? { ...base, title: 'New slide', talking_points: ['Point 1', 'Point 2'] }
      : type === 'poll' ? { ...base, question: 'New poll question', options: ['Option A', 'Option B', 'Option C'] }
      : { ...base, question: 'New quiz question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct_answer: 0, explanation: 'Explanation here' }
    ])
  }

  const publish = async () => {
    if (!workshop) return
    setSaving(true)
    try {
      await api.updateWorkshop(workshop.id, { ...workshop.content, steps })
      setWorkshop({ ...workshop, content: { ...workshop.content, steps } })
      nav(`/host/setup/${workshop.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const currentLabel = mode === 'webinar' ? 'webinar' : 'workshop'

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-fuchsia-400/15 to-sky-400/10 blur-3xl" />
      </div>

      <nav className="relative z-20 sticky top-0 border-b border-white/60 bg-white/70 backdrop-blur-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0"><Logo /></div>
          <div className="flex items-center gap-2 shrink-0">
            {screen !== 'chooser' && <button onClick={() => setScreen('chooser')} className="btn-ghost text-sm"><ChevronLeft className="w-4 h-4" /> Change session type</button>}
            <button onClick={() => nav('/host/dashboard')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 px-4 sm:px-6 py-10">
        {screen === 'chooser' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 backdrop-blur-xl shadow-sm">
                <Sparkles className="w-3 h-3" /> New session
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">
                Choose the session type
              </h1>
              <p className="text-sm text-slate-500 mt-3 max-w-2xl leading-relaxed">
                Webinars are fast, goal-led sessions for broad topics. Workshops are deeper, context-rich sessions tied to a project, objective, agenda, and target audience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { mode: 'webinar' as const, icon: Radio, title: 'Webinar', gradient: 'from-sky-500 to-indigo-600', tint: 'from-sky-50 to-indigo-50/40', border: 'hover:border-sky-300', badge: 'default', tags: ['Quick setup', 'Broad audience', 'Topic-led'], desc: 'Use this for general learning, awareness sessions, demos, and topic-based education. Enter a goal and AI builds the live session.' },
                { mode: 'workshop' as const, icon: Briefcase, title: 'Workshop', gradient: 'from-violet-500 to-fuchsia-600', tint: 'from-violet-50 to-fuchsia-50/40', border: 'hover:border-violet-300', badge: 'success', tags: ['Project context', 'Targeted agenda', 'Deeper output'], desc: 'Use this for project-specific sessions with a clear objective, client context, agenda, discussion topics, and reference material.' },
              ].map(card => (
                <button key={card.mode} onClick={() => chooseMode(card.mode)} className={clsx('group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-7 text-left backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10', card.border)}>
                  <div className={clsx('pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br opacity-40 blur-3xl transition-opacity group-hover:opacity-70', card.tint)} />
                  <div className={clsx('relative w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg', card.gradient, card.mode === 'webinar' ? 'shadow-sky-500/30' : 'shadow-violet-500/30')}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{card.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {card.tags.map(item => <Badge key={item} variant={card.badge as any}>{item}</Badge>)}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
                    Create {card.title.toLowerCase()} session <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'form' && mode === 'webinar' && (
          <div className="w-full max-w-lg mx-auto animate-fade-in">
            <div className="relative rounded-3xl border border-white/60 bg-white/70 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_20px_70px_-20px_rgba(79,70,229,0.25)]">
              <div className="mb-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Create webinar session</h1>
                <p className="text-sm text-slate-500 mt-1.5">Enter a general goal. AI generates slides, polls, and quizzes for a live webinar.</p>
              </div>
              {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 backdrop-blur">{error}</div>}
              <div className="space-y-5">
                <div><label className="label">Webinar goal</label>
                  <input className="input text-base" placeholder="e.g. Teach leaders how AI agents work"
                    value={webinarForm.topic} onChange={e => setWebinarForm(f => ({ ...f, topic: e.target.value }))} onKeyDown={e => e.key === 'Enter' && generate()} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Duration</label>
                    <select className="select" value={webinarForm.duration} onChange={e => setWebinarForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                      {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div><label className="label">Audience</label>
                    <select className="select" value={webinarForm.level} onChange={e => setWebinarForm(f => ({ ...f, level: e.target.value as typeof LEVELS[number] }))}>
                      {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map(t => (
                      <button key={t} onClick={() => setWebinarForm(f => ({ ...f, tone: t }))}
                        className={clsx('px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.98]',
                          webinarForm.tone === t ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white/70 text-slate-600 hover:border-indigo-200 hover:bg-white')}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generate} className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                  <Sparkles className="w-4 h-4" /> Generate session
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === 'form' && mode === 'workshop' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
              <aside className="rounded-3xl border border-white/60 bg-white/70 p-3 backdrop-blur-2xl shadow-sm h-fit lg:sticky lg:top-24">
                {['Project', 'Objective', 'Agenda', 'Reference'].map((label, i) => (
                  <button key={label} onClick={() => setWorkshopStep(i)}
                    className={clsx('w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all',
                      workshopStep === i ? 'bg-gradient-to-r from-indigo-50 to-violet-50/60 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50/70')}>
                    <span className={clsx('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                      workshopStep === i ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 text-slate-400')}>{i + 1}</span>
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </aside>

              <section className="relative rounded-3xl border border-white/60 bg-white/70 p-6 lg:p-8 backdrop-blur-2xl shadow-[0_20px_70px_-20px_rgba(79,70,229,0.2)]">
                <div className="mb-6">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Create workshop session</h1>
                  <p className="text-sm text-slate-500 mt-1.5">Give AI enough context to design a project-specific working session.</p>
                </div>
                {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 backdrop-blur">{error}</div>}

                {workshopStep === 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="label">Project name *</label><input className="input" value={workshopForm.project_name} onChange={e => setWorkshopForm(f => ({ ...f, project_name: e.target.value }))} placeholder="e.g. North America inventory reset" /></div>
                      <div><label className="label">Client name</label><input className="input" value={workshopForm.client_name} onChange={e => setWorkshopForm(f => ({ ...f, client_name: e.target.value }))} placeholder="e.g. Acme Retail" /></div>
                    </div>
                    <div><label className="label">Project description *</label><textarea className="input" rows={5} value={workshopForm.project_description} onChange={e => setWorkshopForm(f => ({ ...f, project_description: e.target.value }))} placeholder="Describe the business situation, current challenges, stakeholders, constraints, and what is known so far." /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="label">Business domain *</label><input className="input" value={workshopForm.business_domain} onChange={e => setWorkshopForm(f => ({ ...f, business_domain: e.target.value }))} placeholder="e.g. Retail supply chain" /></div>
                      <div><label className="label">Workshop type *</label><select className="select" value={workshopForm.workshop_type} onChange={e => setWorkshopForm(f => ({ ...f, workshop_type: e.target.value as typeof WORKSHOP_TYPES[number]['value'] }))}>{WORKSHOP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    </div>
                  </div>
                )}

                {workshopStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div><label className="label">Objective of the workshop *</label><textarea className="input" rows={5} value={workshopForm.objective} onChange={e => setWorkshopForm(f => ({ ...f, objective: e.target.value }))} placeholder="What should participants decide, align on, diagnose, or produce by the end?" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="label">Duration</label><select className="select" value={workshopForm.duration} onChange={e => setWorkshopForm(f => ({ ...f, duration: Number(e.target.value) }))}>{DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}</select></div>
                      <div><label className="label">Audience</label><select className="select" value={workshopForm.level} onChange={e => setWorkshopForm(f => ({ ...f, level: e.target.value as typeof LEVELS[number] }))}>{LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}</select></div>
                      <div><label className="label">Tone</label><select className="select" value={workshopForm.tone} onChange={e => setWorkshopForm(f => ({ ...f, tone: e.target.value as typeof TONES[number] }))}>{TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                    </div>
                  </div>
                )}

                {workshopStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div><label className="label">Agenda</label><textarea className="input font-mono text-xs" rows={6} value={workshopForm.agenda} onChange={e => setWorkshopForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Intro (10 min)" /></div>
                    <div><label className="label">Discussion topics</label><textarea className="input" rows={6} value={workshopForm.discussion_topics} onChange={e => setWorkshopForm(f => ({ ...f, discussion_topics: e.target.value }))} placeholder="One topic per line. e.g. Demand variability, supplier constraints, decision rights." /></div>
                  </div>
                )}

                {workshopStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="label">Reference document</label>
                      <label className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50/70 to-white px-4 py-10 cursor-pointer hover:border-indigo-300 hover:from-indigo-50/60 hover:to-white transition-all">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{workshopForm.reference_document_name || 'Upload a text reference file'}</span>
                        <span className="text-xs text-slate-400">TXT, MD, CSV, or JSON works best. Content is used only for generation context.</span>
                        <input type="file" className="hidden" accept=".txt,.md,.csv,.json" onChange={e => { const file = e.target.files?.[0]; if (file) readReferenceFile(file) }} />
                      </label>
                    </div>
                    <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 p-4 backdrop-blur-xl">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 shrink-0">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800">Ready to generate</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">AI will use your project context, objective, agenda, discussion topics, and uploaded reference text to build a structured workshop session.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button onClick={() => setWorkshopStep(s => Math.max(0, s - 1))} disabled={workshopStep === 0} className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Back</button>
                  {workshopStep < 3 ? (
                    <button onClick={() => setWorkshopStep(s => Math.min(3, s + 1))} className="btn-primary shadow-md shadow-indigo-500/25">Next <ChevronRight className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={generate} className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                      <Sparkles className="w-4 h-4" /> Generate session
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {screen === 'generating' && (
          <div className="text-center mt-24 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-7">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-500 animate-ping opacity-30" />
              <div className="absolute inset-2 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse opacity-50" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent mb-2">Building your {currentLabel}</h2>
            <p className="text-sm text-slate-500">Generating slides, polls, and quizzes</p>
            <p className="text-xs text-slate-400 mt-1">Usually 10 to 20 seconds</p>
            <div className="mt-8 flex items-center justify-center gap-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}

        {screen === 'editor' && workshop && (
          <div className="w-full max-w-3xl mx-auto animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 backdrop-blur-2xl shadow-[0_20px_70px_-20px_rgba(79,70,229,0.2)] mb-5">
              <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/25 to-violet-500/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge variant={workshop.content.metadata?.mode === 'workshop' ? 'success' : 'slide'}>{workshop.content.metadata?.mode || 'webinar'}</Badge>
                  <h1 className="text-2xl font-bold text-slate-900 mt-2 truncate">{workshop.content.title}</h1>
                  <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                    <span>{workshop.content.estimated_duration_minutes} min</span>
                    <span>·</span>
                    <span>{steps.length} steps</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{steps.filter(s => s.type === 'slide').length} slides</span>
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{steps.filter(s => s.type === 'poll').length} polls</span>
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{steps.filter(s => s.type === 'quiz').length} quizzes</span>
                  </p>
                </div>
                <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            {error && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 backdrop-blur">{error}</div>}
            <div className="space-y-2 mb-4">
              {steps.map((s, i) => (
                <StepEditor key={i} step={s} idx={i} total={steps.length}
                  onChange={u => updateStep(i, u)} onDelete={() => deleteStep(i)} onMove={d => moveStep(i, d)} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {(['slide', 'poll', 'quiz'] as const).map(type => (
                <button key={type} onClick={() => addStep(type)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur hover:border-indigo-300 hover:bg-white hover:text-indigo-700 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add {type}
                </button>
              ))}
            </div>
            <div className="sticky bottom-4 z-10">
              <button onClick={publish} disabled={saving || steps.length === 0}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-semibold text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save and publish'} {!saving && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
