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
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50" onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-mono text-gray-400 w-5 text-right">{idx + 1}</span>
        <Badge variant={step.type}>{step.type}</Badge>
        <span className="text-sm text-gray-700 flex-1 truncate font-medium">
          {step.type === 'slide' ? step.title || 'Untitled' : step.question || 'Untitled'}
        </span>
        <div className="flex items-center gap-1 ml-auto" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 bg-gray-50">
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
              <div><label className="label">Options {step.type === 'quiz' && <span className="text-gray-400 normal-case font-normal">(click circle = correct)</span>}</label>
                <div className="space-y-2">
                  {(step.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      {step.type === 'quiz' && (
                        <button onClick={() => onChange({ ...step, correct_answer: oi })}
                          className={clsx('w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all', step.correct_answer === oi ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-emerald-400')} />
                      )}
                      <input className="input" value={opt} onChange={e => { const o = [...(step.options || [])]; o[oi] = e.target.value; onChange({ ...step, options: o }) }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                      <button onClick={() => onChange({ ...step, options: (step.options || []).filter((_, i) => i !== oi) })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
    <div className="app-shell min-h-screen flex flex-col">
      <nav className="glass-panel border-x-0 border-t-0 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-2">
          {screen !== 'chooser' && <button onClick={() => setScreen('chooser')} className="btn-ghost text-sm"><ChevronLeft className="w-4 h-4" /> Change session type</button>}
          <button onClick={() => nav('/host/dashboard')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
        </div>
      </nav>

      <div className="flex-1 px-4 py-8">
        {screen === 'chooser' && (
          <div className="max-w-5xl mx-auto animate-slide-up">
            <div className="mb-7">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">New session</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Choose the session type</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                Webinars are fast, goal-led sessions for broad topics. Workshops are deeper, context-rich sessions tied to a project, objective, agenda, and target audience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button onClick={() => chooseMode('webinar')} className="group card p-6 text-left hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5">
                  <Radio className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Webinar</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Use this for general learning, awareness sessions, demos, and topic-based education. Enter a goal and AI builds the live session.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Quick setup', 'Broad audience', 'Topic-led'].map(item => <Badge key={item}>{item}</Badge>)}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-600">Create webinar session <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </button>

              <button onClick={() => chooseMode('workshop')} className="group card p-6 text-left hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Workshop</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Use this for project-specific sessions with a clear objective, client context, agenda, discussion topics, and reference material.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Project context', 'Targeted agenda', 'Deeper output'].map(item => <Badge key={item} variant="success">{item}</Badge>)}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-600">Create workshop session <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </button>
            </div>
          </div>
        )}

        {screen === 'form' && mode === 'webinar' && (
          <div className="w-full max-w-lg mx-auto animate-slide-up">
            <div className="glass-panel p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create webinar session</h1>
              <p className="text-sm text-gray-500 mb-7">Enter a general goal. AI generates slides, polls, and quizzes for a live webinar.</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
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
                        className={clsx('px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                          webinarForm.tone === t ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generate} className="btn-primary w-full py-3 justify-center text-base">
                  <Sparkles className="w-4 h-4" /> Generate session
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === 'form' && mode === 'workshop' && (
          <div className="max-w-5xl mx-auto animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
            <aside className="card p-4 h-fit">
                {['Project', 'Objective', 'Agenda', 'Reference'].map((label, i) => (
                  <button key={label} onClick={() => setWorkshopStep(i)}
                    className={clsx('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all',
                      workshopStep === i ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50')}>
                    <span className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                      workshopStep === i ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400')}>{i + 1}</span>
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </aside>

              <section className="glass-panel p-6 lg:p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Create workshop session</h1>
                  <p className="text-sm text-gray-500 mt-1">Give AI enough context to design a project-specific working session.</p>
                </div>
                {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

                {workshopStep === 0 && (
                  <div className="space-y-4">
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
                  <div className="space-y-4">
                    <div><label className="label">Objective of the workshop *</label><textarea className="input" rows={5} value={workshopForm.objective} onChange={e => setWorkshopForm(f => ({ ...f, objective: e.target.value }))} placeholder="What should participants decide, align on, diagnose, or produce by the end?" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="label">Duration</label><select className="select" value={workshopForm.duration} onChange={e => setWorkshopForm(f => ({ ...f, duration: Number(e.target.value) }))}>{DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}</select></div>
                      <div><label className="label">Audience</label><select className="select" value={workshopForm.level} onChange={e => setWorkshopForm(f => ({ ...f, level: e.target.value as typeof LEVELS[number] }))}>{LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}</select></div>
                      <div><label className="label">Tone</label><select className="select" value={workshopForm.tone} onChange={e => setWorkshopForm(f => ({ ...f, tone: e.target.value as typeof TONES[number] }))}>{TONES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                    </div>
                  </div>
                )}

                {workshopStep === 2 && (
                  <div className="space-y-4">
                    <div><label className="label">Agenda</label><textarea className="input font-mono text-xs" rows={6} value={workshopForm.agenda} onChange={e => setWorkshopForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Intro (10 min)" /></div>
                    <div><label className="label">Discussion topics</label><textarea className="input" rows={6} value={workshopForm.discussion_topics} onChange={e => setWorkshopForm(f => ({ ...f, discussion_topics: e.target.value }))} placeholder="One topic per line. e.g. Demand variability, supplier constraints, decision rights." /></div>
                  </div>
                )}

                {workshopStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="label">Reference document</label>
                      <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600">{workshopForm.reference_document_name || 'Upload a text reference file'}</span>
                        <span className="text-xs text-gray-400">TXT, MD, CSV, or JSON works best. Content is used only for generation context.</span>
                        <input type="file" className="hidden" accept=".txt,.md,.csv,.json" onChange={e => { const file = e.target.files?.[0]; if (file) readReferenceFile(file) }} />
                      </label>
                    </div>
                    <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 backdrop-blur-xl">
                      <div className="flex gap-3">
                        <FileText className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-gray-800">Ready to generate</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">AI will use your project context, objective, agenda, discussion topics, and uploaded reference text to build a structured workshop session.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button onClick={() => setWorkshopStep(s => Math.max(0, s - 1))} disabled={workshopStep === 0} className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Back</button>
                  {workshopStep < 3 ? (
                    <button onClick={() => setWorkshopStep(s => Math.min(3, s + 1))} className="btn-primary">Next <ChevronRight className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={generate} className="btn-primary"><Sparkles className="w-4 h-4" /> Generate session</button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {screen === 'generating' && (
          <div className="text-center mt-20 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-brand-100 animate-ping opacity-60" />
              <div className="relative w-20 h-20 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-brand-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Building your {currentLabel}</h2>
            <p className="text-sm text-gray-500">Generating slides, polls, and quizzes</p>
            <p className="text-xs text-gray-400 mt-1">Usually 10 to 20 seconds</p>
          </div>
        )}

        {screen === 'editor' && workshop && (
          <div className="w-full max-w-2xl mx-auto animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant={workshop.content.metadata?.mode === 'workshop' ? 'success' : 'slide'}>{workshop.content.metadata?.mode || 'webinar'}</Badge>
                <h1 className="text-xl font-bold text-gray-900 mt-2">{workshop.content.title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {workshop.content.estimated_duration_minutes} min · {steps.length} steps ·{' '}
                  <span className="text-blue-600">{steps.filter(s => s.type === 'slide').length} slides</span> ·{' '}
                  <span className="text-amber-600">{steps.filter(s => s.type === 'poll').length} polls</span> ·{' '}
                  <span className="text-emerald-600">{steps.filter(s => s.type === 'quiz').length} quizzes</span>
                </p>
              </div>
            </div>
            {error && <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
            <div className="space-y-2 mb-4">
              {steps.map((s, i) => (
                <StepEditor key={i} step={s} idx={i} total={steps.length}
                  onChange={u => updateStep(i, u)} onDelete={() => deleteStep(i)} onMove={d => moveStep(i, d)} />
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              {(['slide', 'poll', 'quiz'] as const).map(type => (
                <button key={type} onClick={() => addStep(type)} className="btn-ghost text-xs py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add {type}
                </button>
              ))}
            </div>
            <div className="sticky bottom-4">
              <button onClick={publish} disabled={saving || steps.length === 0} className="btn-primary w-full py-3 justify-center text-base shadow-brand">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save and publish'} {!saving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
