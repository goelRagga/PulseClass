import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Settings,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { HostHeader } from '@/components/host/HostHeader'
import { Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore, useHostStore } from '@/stores'
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

// ── Step type colours ────────────────────────────────────────────────────────
const STEP_STYLE = {
  slide: { pill: 'bg-blue-100 text-blue-700', num: 'bg-[#e5eeff] text-[#4648d4]', ring: 'ring-[#4648d4]/20' },
  poll:  { pill: 'bg-[#e9ddff] text-[#6b38d4]', num: 'bg-[#f0ebff] text-[#6b38d4]', ring: 'ring-[#6b38d4]/20' },
  quiz:  { pill: 'bg-amber-50 text-amber-600', num: 'bg-amber-50 text-amber-600', ring: 'ring-amber-400/20' },
}

// ── Sidebar nav item (shared style with dashboard) ───────────────────────────
function EditorNavItem({
  label, icon: Icon, active, onClick,
}: { label: string; icon: React.ElementType; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200',
        active ? 'bg-[#8455ef] text-white shadow-md' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
      )}
    >
      <Icon className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400')} />
      <span>{label}</span>
    </button>
  )
}

// ── Step editor card ──────────────────────────────────────────────────────────
function StepEditor({
  step, idx, total, onChange, onDelete, onMove,
}: {
  step: WorkshopStep; idx: number; total: number
  onChange: (s: WorkshopStep) => void; onDelete: () => void; onMove: (d: -1 | 1) => void
}) {
  const style = STEP_STYLE[step.type]

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_6px_rgba(99,102,241,0.05)] transition-all hover:ring-2 hover:ring-[#4648d4]/15">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={clsx('w-8 h-8 flex items-center justify-center rounded-full text-[12px] font-bold shrink-0', style.num)}>
            {idx + 1}
          </span>
          <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider', style.pill)}>
            {step.type}
          </span>
          <h3 className="text-[14px] font-semibold text-slate-800 truncate max-w-[260px]">
            {step.type === 'slide' ? (step.title || 'Untitled slide') : (step.question || 'Untitled question')}
          </h3>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editing fields */}
      <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 bg-white/40">
        {step.type === 'slide' && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
              <input
                className="w-full bg-white border border-slate-200/80 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all"
                value={step.title || ''}
                onChange={e => onChange({ ...step, title: e.target.value })}
                placeholder="Slide title"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Talking Points</label>
              <textarea
                className="w-full bg-white border border-slate-200/80 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all resize-none"
                rows={3}
                value={(step.talking_points || []).join('\n')}
                onChange={e => onChange({ ...step, talking_points: e.target.value.split('\n') })}
                placeholder="One point per line"
              />
            </div>
          </>
        )}

        {(step.type === 'poll' || step.type === 'quiz') && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Question</label>
              <input
                className="w-full bg-white border border-slate-200/80 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all"
                value={step.question || ''}
                onChange={e => onChange({ ...step, question: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Options{step.type === 'quiz' && <span className="normal-case font-normal text-slate-300 ml-1">(click circle = correct)</span>}
              </label>
              <div className="space-y-2">
                {(step.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {step.type === 'quiz' && (
                      <button
                        onClick={() => onChange({ ...step, correct_answer: oi })}
                        className={clsx(
                          'w-5 h-5 rounded-full border-2 shrink-0 transition-all',
                          step.correct_answer === oi
                            ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/30'
                            : 'border-slate-300 hover:border-emerald-400'
                        )}
                      />
                    )}
                    <input
                      className="flex-1 bg-white border border-slate-200/80 rounded-lg px-4 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all"
                      value={opt}
                      onChange={e => {
                        const o = [...(step.options || [])]
                        o[oi] = e.target.value
                        onChange({ ...step, options: o })
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    />
                    <button
                      onClick={() => onChange({ ...step, options: (step.options || []).filter((_, i) => i !== oi) })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onChange({ ...step, options: [...(step.options || []), ''] })}
                  className="flex items-center gap-1.5 text-[#4648d4] text-[12px] font-bold hover:underline underline-offset-2 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              </div>
            </div>
            {step.type === 'quiz' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Explanation</label>
                <textarea
                  className="w-full bg-white border border-slate-200/80 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] outline-none transition-all resize-none"
                  rows={2}
                  value={step.explanation || ''}
                  onChange={e => onChange({ ...step, explanation: e.target.value })}
                  placeholder="Explanation for the correct answer"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HostCreate() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const { setWorkshop, hostId } = useHostStore()
  const [screen, setScreen] = useState<Screen>('chooser')
  const [mode, setMode] = useState<CreationMode>('webinar')
  const [workshopStep, setWorkshopStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [workshop, setLocalWorkshop] = useState<Workshop | null>(null)
  const [steps, setSteps] = useState<WorkshopStep[]>([])
  const [aiSuggestionsState, setAiSuggestionsState] = useState<{ id: string; color: 'primary' | 'secondary'; title: string; body: string; action: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    setMode(nextMode); setError(''); setScreen('form')
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
    setWorkshopForm(f => ({ ...f, reference_document_name: file.name, reference_document_content: text.slice(0, 12000) }))
  }

  const generate = async () => {
    setError('')
    const payload = mode === 'webinar'
      ? { ...webinarForm, topic: webinarForm.topic.trim(), mode, host_id: hostId }
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
    if (mode === 'workshop') { const v = validateWorkshop(); if (v) { setError(v); return } }

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
      : type === 'poll'
        ? { ...base, question: 'New poll question', options: ['Option A', 'Option B', 'Option C'] }
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

  useEffect(() => {
    if (screen !== 'editor' || !workshop || steps.length === 0) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      try {
        const res = await api.suggestWorkshop(workshop.content.title, steps) as { suggestions: { title: string; body: string; action: string; color: string }[] }
        setAiSuggestionsState(
          (res.suggestions || []).map((s, i) => ({
            id: `ai-${i}`,
            color: (s.color === 'primary' || s.color === 'secondary') ? s.color : (i === 0 ? 'primary' : 'secondary'),
            title: s.title,
            body: s.body,
            action: s.action,
          }))
        )
      } catch {
        // fall back to empty — static fallback below handles it
      } finally {
        setAiLoading(false)
      }
    }, 1200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [screen, workshop?.id, steps.length])

  const currentLabel = mode === 'webinar' ? 'webinar' : 'workshop'

  // ── Full-screen editor (early return) ──────────────────────────────────────
  if (screen === 'editor' && workshop) {
    const slideCount = steps.filter(s => s.type === 'slide').length
    const pollCount = steps.filter(s => s.type === 'poll').length
    const quizCount = steps.filter(s => s.type === 'quiz').length
    const contentMode = workshop.content.metadata?.mode || mode
    const duration = workshop.content.estimated_duration_minutes

    const completedCount = steps.filter(s => {
      if (s.type === 'slide') return !!(s.title?.trim()) && (s.talking_points?.some(tp => tp.trim()) ?? false)
      return !!(s.question?.trim()) && ((s.options?.filter(o => o.trim()).length ?? 0) >= 2)
    }).length
    const completeness = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

    const aiSuggestions = aiSuggestionsState

    const previewStep = steps[0]
    const userName = user?.display_name || (user as any)?.name || 'Host'

    return (
      <div className="flex h-[100dvh] overflow-hidden bg-[#f8f9ff]">

        {/* ── Left sidebar ── */}
        <aside className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/80 py-6 px-4 z-50 shrink-0">
          <div className="px-2 mb-8">
            <Logo size="md" />
            <p className="mt-1 text-[11px] font-medium text-slate-400 pl-[52px]">Host Admin</p>
          </div>
          <nav className="flex-1 space-y-1">
            <EditorNavItem label="Dashboard"  icon={LayoutDashboard} onClick={() => nav('/host/dashboard')} />
            <EditorNavItem label="Sessions Library"   icon={CalendarDays}    active onClick={() => nav('/host/workshops')} />
            {/* <EditorNavItem label="Library"    icon={BookOpen}        onClick={() => nav('/host/workshops')} />
            <EditorNavItem label="Analytics"  icon={BarChart3}       onClick={() => {}} />
            <EditorNavItem label="Settings"   icon={Settings}        onClick={() => {}} /> */}
          </nav>
          <div className="mt-auto p-3.5 bg-white/60 rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4648d4] to-[#6b38d4] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                {userName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400">Host Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Content column ── */}
        <div className="flex-1 ml-64 flex flex-col h-full overflow-hidden">

          {/* Top nav */}
          <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[13px] text-slate-500">
                <button onClick={() => nav('/host/dashboard')} className="hover:text-[#4648d4] transition-colors font-medium">
                  Dashboard
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-900 font-semibold">New Session</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScreen('form')}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all text-[13px] font-medium active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={saving || steps.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4648d4] to-[#6b38d4] text-white rounded-lg text-[13px] font-semibold shadow-[0_4px_14px_rgba(70,72,212,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save & Publish'}
              </button>
            </div>
          </header>

          {/* Scrollable canvas */}
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-[1060px] mx-auto">

              {/* Session header */}
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <span className="inline-block px-3 py-1 bg-[#6063ee] text-white text-[10px] font-bold rounded-full uppercase tracking-widest mb-3">
                    {contentMode}
                  </span>
                  <h1 className="text-[36px] font-bold leading-tight tracking-tight text-slate-900">
                    {workshop.content.title}
                  </h1>
                  <div className="flex items-center gap-5 mt-2 text-[13px] text-slate-500">
                    <span className="flex items-center gap-1.5"><Radio className="h-4 w-4" />{duration} min</span>
                    <span className="flex items-center gap-1.5"><ChevronRight className="h-4 w-4" />{steps.length} steps</span>
                    {pollCount > 0 && <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#6b38d4]" />{pollCount} polls</span>}
                    {quizCount > 0 && <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{quizCount} quizzes</span>}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              {/* Bento grid */}
              <div className="grid grid-cols-12 gap-6 items-start">

                {/* Steps column — 8 cols */}
                <div className="col-span-8 space-y-4">
                  {steps.map((s, i) => (
                    <StepEditor
                      key={i}
                      step={s}
                      idx={i}
                      total={steps.length}
                      onChange={u => updateStep(i, u)}
                      onDelete={() => deleteStep(i)}
                      onMove={d => moveStep(i, d)}
                    />
                  ))}

                  {/* Add step row */}
                  <div className="flex items-center justify-center gap-3 py-7 border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#4648d4]/40 transition-colors group">
                    {(['slide', 'poll', 'quiz'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => addStep(type)}
                        className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border border-slate-200/80 rounded-full text-[12px] font-semibold text-slate-600 hover:shadow-md hover:border-[#4648d4]/30 hover:text-[#4648d4] transition-all active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right panel — 4 cols */}
                <div className="col-span-4 sticky top-0 flex flex-col gap-4 max-h-[calc(100dvh-4rem)] overflow-y-auto pb-8">

                  {/* IntelliAssistant */}
                  <div className="bg-white/70 overflow-auto backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05)] relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-[0.07] pointer-events-none">
                      <Sparkles className="h-[90px] w-[90px] text-[#4648d4]" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="p-1.5 bg-[#e1e0ff] rounded-lg">
                        <Sparkles className="h-4 w-4 text-[#4648d4]" />
                      </div>
                      <h4 className="font-bold text-[15px] text-slate-900">IntelliAssistant</h4>
                    </div>
                    {aiLoading ? (
                      <div className="flex items-center gap-2.5 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[#4648d4] shrink-0" />
                        <p className="text-[13px] text-slate-400">Analyzing session…</p>
                      </div>
                    ) : aiSuggestions.length === 0 ? (
                      <p className="text-[13px] text-slate-400 text-center py-3">Session looks great! No suggestions right now.</p>
                    ) : (
                      <div className="space-y-3">
                        {aiSuggestions.map(s => (
                          <div
                            key={s.id}
                            className={clsx(
                              'p-3.5 rounded-xl border',
                              s.color === 'primary'
                                ? 'bg-[#4648d4]/5 border-[#4648d4]/10'
                                : 'bg-[#6b38d4]/5 border-[#6b38d4]/10'
                            )}
                          >
                            <p className="text-[13px] font-semibold text-slate-800 mb-1">{s.title}</p>
                            <p className="text-[12px] text-slate-500 leading-relaxed">{s.body}</p>
                            <button
                              className={clsx(
                                'mt-2.5 text-[11px] font-bold hover:underline underline-offset-2',
                                s.color === 'primary' ? 'text-[#4648d4]' : 'text-[#6b38d4]'
                              )}
                            >
                              {s.action}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Session Progress */}
                  <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_6px_rgba(99,102,241,0.05)]">
                    <h4 className="font-bold text-[15px] text-slate-900 mb-5">Session Progress</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[12px] font-semibold mb-1.5">
                          <span className="text-slate-500">Completeness</span>
                          <span className="text-slate-900">{completeness}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#4648d4] to-[#6b38d4] transition-all duration-500"
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-[#eff4ff] rounded-xl text-center">
                          <p className="text-[22px] font-bold text-[#4648d4] leading-none">{duration}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Minutes</p>
                        </div>
                        <div className="p-3 bg-[#f0ebff] rounded-xl text-center">
                          <p className="text-[22px] font-bold text-[#6b38d4] leading-none">{String(steps.length).padStart(2, '0')}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Total Steps</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Preview */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-lg">
                    <div className="px-4 py-3 bg-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mobile Preview</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-zinc-700" />
                        <div className="w-2 h-2 rounded-full bg-zinc-700" />
                      </div>
                    </div>
                    <div className="h-48 bg-white m-2 rounded-xl overflow-hidden flex flex-col items-center justify-center p-5 text-center relative">
                      {previewStep ? (
                        <>
                          <div className="mb-3">
                            <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded uppercase', STEP_STYLE[previewStep.type].pill)}>
                              {previewStep.type}
                            </span>
                          </div>
                          <h5 className="text-[15px] font-bold text-slate-900 mb-2 leading-snug">
                            {previewStep.type === 'slide' ? (previewStep.title || 'Slide') : (previewStep.question || 'Question')}
                          </h5>
                          <p className="text-[12px] text-slate-500 leading-relaxed">
                            {previewStep.type === 'slide'
                              ? previewStep.talking_points?.[0] || ''
                              : previewStep.options?.[0] || ''
                            }
                          </p>
                          <div className="absolute bottom-3 left-0 w-full px-4 flex justify-between items-center">
                            <div className="h-0.5 w-10 bg-slate-200 rounded-full" />
                            <span className="text-[10px] text-slate-400">1 / {steps.length}</span>
                            <div className="h-0.5 w-10 bg-slate-200 rounded-full" />
                          </div>
                        </>
                      ) : (
                        <p className="text-[13px] text-slate-400">No steps yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── Non-editor screens (chooser / form / generating) ─────────────────────
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-fuchsia-400/15 to-sky-400/10 blur-3xl" />
      </div>

      <HostHeader
        backTo={screen !== 'chooser' ? '/host/workshops' : '/host/dashboard'}
        backLabel={screen !== 'chooser' ? 'Sessions' : 'Dashboard'}
        breadcrumbs={[
          { label: 'Host', to: '/host/dashboard' },
          { label: 'Sessions', to: '/host/workshops' },
          { label: screen === 'chooser' ? 'Create' : mode === 'webinar' ? 'Webinar' : 'Workshop' },
        ]}
        rightSlot={(
          <div className="flex items-center gap-2 shrink-0">
            {screen !== 'chooser' && (
              <button onClick={() => setScreen('chooser')} className="btn-ghost text-sm">
                <ChevronLeft className="w-4 h-4" /> Change session type
              </button>
            )}
            <button onClick={() => nav('/host/dashboard')} className="btn-ghost text-sm">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
          </div>
        )}
      />

      <div className="relative z-10 flex-1 px-4 sm:px-6 py-10">
        {screen === 'chooser' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 backdrop-blur-xl shadow-sm">
                <Sparkles className="w-3 h-3" /> New session
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
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
                <div>
                  <label className="label">Webinar goal</label>
                  <input className="input text-base" placeholder="e.g. Teach leaders how AI agents work"
                    value={webinarForm.topic} onChange={e => setWebinarForm(f => ({ ...f, topic: e.target.value }))} onKeyDown={e => e.key === 'Enter' && generate()} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Duration</label>
                    <select className="select" value={webinarForm.duration} onChange={e => setWebinarForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                      {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Audience</label>
                    <select className="select" value={webinarForm.level} onChange={e => setWebinarForm(f => ({ ...f, level: e.target.value as typeof LEVELS[number] }))}>
                      {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Tone</label>
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
                    <div><label className="label">Discussion topics</label><textarea className="input" rows={6} value={workshopForm.discussion_topics} onChange={e => setWorkshopForm(f => ({ ...f, discussion_topics: e.target.value }))} placeholder="One topic per line." /></div>
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
                        <span className="text-xs text-slate-400">TXT, MD, CSV, or JSON works best.</span>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Building your {currentLabel}</h2>
            <p className="text-sm text-slate-500">Generating slides, polls, and quizzes</p>
            <p className="text-xs text-slate-400 mt-1">Usually 10 to 20 seconds</p>
            <div className="mt-8 flex items-center justify-center gap-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
