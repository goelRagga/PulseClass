import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft, Loader2, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Logo, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import type { Workshop, WorkshopStep } from '@/types'
import { clsx } from 'clsx'

type Screen = 'form' | 'generating' | 'editor'
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
const TONES  = ['conversational', 'professional', 'energetic'] as const
const DURATIONS = [15, 30, 45, 60]

function StepEditor({ step, idx, total, onChange, onDelete, onMove }: {
  step: WorkshopStep; idx: number; total: number
  onChange: (s: WorkshopStep) => void; onDelete: () => void; onMove: (d: -1|1) => void
}) {
  const [open, setOpen] = useState(idx === 0)
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
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
          {step.type === 'slide' && (<>
            <div><label className="label">Title</label><input className="input" value={step.title||''} onChange={e=>onChange({...step,title:e.target.value})} /></div>
            <div><label className="label">Talking points (one per line)</label>
              <textarea className="input" rows={4} value={(step.talking_points||[]).join('\n')} onChange={e=>onChange({...step,talking_points:e.target.value.split('\n')})} /></div>
          </>)}
          {(step.type==='poll'||step.type==='quiz') && (<>
            <div><label className="label">Question</label><input className="input" value={step.question||''} onChange={e=>onChange({...step,question:e.target.value})} /></div>
            <div><label className="label">Options {step.type==='quiz'&&<span className="text-gray-400 normal-case font-normal">(click circle = correct)</span>}</label>
              <div className="space-y-2">
                {(step.options||[]).map((opt,oi)=>(
                  <div key={oi} className="flex items-center gap-2">
                    {step.type==='quiz'&&(<button onClick={()=>onChange({...step,correct_answer:oi})}
                      className={clsx('w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',step.correct_answer===oi?'border-emerald-500 bg-emerald-500':'border-gray-300 hover:border-emerald-400')} />)}
                    <input className="input" value={opt} onChange={e=>{const o=[...(step.options||[])];o[oi]=e.target.value;onChange({...step,options:o})}} placeholder={`Option ${String.fromCharCode(65+oi)}`} />
                    <button onClick={()=>onChange({...step,options:(step.options||[]).filter((_,i)=>i!==oi)})} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={()=>onChange({...step,options:[...(step.options||[]),'']}) } className="btn-ghost text-xs py-1.5"><Plus className="w-3.5 h-3.5" /> Add option</button>
              </div>
            </div>
            {step.type==='quiz'&&<div><label className="label">Explanation</label><textarea className="input" rows={2} value={step.explanation||''} onChange={e=>onChange({...step,explanation:e.target.value})} /></div>}
          </>)}
        </div>
      )}
    </div>
  )
}

export default function HostCreate() {
  const nav = useNavigate()
  const { setWorkshop, hostId } = useHostStore()
  const [screen, setScreen] = useState<Screen>('form')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [workshop, setLocalWorkshop] = useState<Workshop | null>(null)
  const [steps, setSteps] = useState<WorkshopStep[]>([])
  const [form, setForm] = useState({ topic:'', duration:30, level:'intermediate' as typeof LEVELS[number], tone:'conversational' as typeof TONES[number] })

  const generate = async () => {
    if (!form.topic.trim()) { setError('Enter a topic first.'); return }
    setError(''); setScreen('generating')
    try {
      const w = await api.generateWorkshop({ ...form, host_id: hostId }) as Workshop
      setLocalWorkshop(w); setSteps(w.content.steps); setScreen('editor')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); setScreen('form') }
  }

  const updateStep = (idx: number, updated: WorkshopStep) => setSteps(s => s.map((st,i) => i===idx ? updated : st))
  const deleteStep = (idx: number) => setSteps(s => s.filter((_,i)=>i!==idx).map((st,i)=>({...st,index:i})))
  const moveStep = (idx: number, dir: -1|1) => setSteps(s => {
    const a=[...s], t=idx+dir
    if(t<0||t>=a.length) return a
    ;[a[idx],a[t]]=[a[t],a[idx]]
    return a.map((st,i)=>({...st,index:i}))
  })
  const addStep = (type: WorkshopStep['type']) => {
    const base = {index:steps.length,type}
    setSteps(s=>[...s, type==='slide'
      ? {...base,title:'New slide',talking_points:['Point 1','Point 2']}
      : type==='poll' ? {...base,question:'New poll question',options:['Option A','Option B','Option C']}
      : {...base,question:'New quiz question',options:['Option A','Option B','Option C','Option D'],correct_answer:0,explanation:'Explanation here'}
    ])
  }

  const goLive = async () => {
    if (!workshop) return
    setSaving(true)
    try {
      await api.updateWorkshop(workshop.id, {...workshop.content, steps})
      setWorkshop({...workshop, content:{...workshop.content, steps}})
      nav(`/host/setup/${workshop.id}`)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-150 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-2">
          {screen==='editor'&&<button onClick={()=>setScreen('form')} className="btn-ghost text-sm">← Regenerate</button>}
          <button onClick={()=>nav('/')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Home</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center px-4 py-10">
        {screen==='form' && (
          <div className="w-full max-w-lg animate-slide-up">
            <div className="bg-white border border-gray-150 rounded-3xl shadow-card-lg p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create workshop</h1>
              <p className="text-sm text-gray-500 mb-7">AI generates slides, polls and quizzes. You can edit everything before going live.</p>
              {error&&<div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <div className="space-y-5">
                <div><label className="label">Topic</label>
                  <input className="input text-base" placeholder="e.g. Introduction to Machine Learning"
                    value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&generate()} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Duration</label>
                    <select className="select" value={form.duration} onChange={e=>setForm(f=>({...f,duration:Number(e.target.value)}))}>
                      {DURATIONS.map(d=><option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div><label className="label">Audience</label>
                    <select className="select" value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value as typeof LEVELS[number]}))}>
                      {LEVELS.map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map(t=>(
                      <button key={t} onClick={()=>setForm(f=>({...f,tone:t}))}
                        className={clsx('px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                          form.tone===t ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>
                        {t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generate} className="btn-primary w-full py-3 justify-center text-base">
                  <Sparkles className="w-4 h-4" /> Generate workshop
                </button>
                <button onClick={()=>nav('/host/workshops')} className="btn-secondary w-full py-2.5 justify-center text-sm">View past workshops</button>
              </div>
            </div>
          </div>
        )}

        {screen==='generating' && (
          <div className="text-center mt-20 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-brand-100 animate-ping opacity-60" />
              <div className="relative w-20 h-20 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-brand-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Building your workshop…</h2>
            <p className="text-sm text-gray-500">Generating slides, polls, and quizzes</p>
            <p className="text-xs text-gray-400 mt-1">Usually 10–15 seconds</p>
          </div>
        )}

        {screen==='editor' && workshop && (
          <div className="w-full max-w-2xl animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{workshop.content.title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {workshop.content.estimated_duration_minutes} min · {steps.length} steps ·{' '}
                  <span className="text-blue-600">{steps.filter(s=>s.type==='slide').length} slides</span> ·{' '}
                  <span className="text-amber-600">{steps.filter(s=>s.type==='poll').length} polls</span> ·{' '}
                  <span className="text-emerald-600">{steps.filter(s=>s.type==='quiz').length} quizzes</span>
                </p>
              </div>
            </div>
            {error&&<div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
            <div className="space-y-2 mb-4">
              {steps.map((s,i)=>(
                <StepEditor key={i} step={s} idx={i} total={steps.length}
                  onChange={u=>updateStep(i,u)} onDelete={()=>deleteStep(i)} onMove={d=>moveStep(i,d)} />
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              {(['slide','poll','quiz'] as const).map(type=>(
                <button key={type} onClick={()=>addStep(type)} className="btn-ghost text-xs py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add {type}
                </button>
              ))}
            </div>
            <div className="sticky bottom-4">
              <button onClick={goLive} disabled={saving||steps.length===0} className="btn-primary w-full py-3 justify-center text-base shadow-brand">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save & go live'} {!saving&&<ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}