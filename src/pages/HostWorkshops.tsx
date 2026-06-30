import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Radio, BarChart3, Clock, Loader2, BookOpen } from 'lucide-react'
import { Logo, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import { useHostStore } from '@/stores'
import type { Workshop } from '@/types'
import { clsx } from 'clsx'

interface WorkshopMeta { id: string; topic: string; level: string; created_at: string }

export default function HostWorkshops() {
  const nav = useNavigate()
  const { hostId, setWorkshop } = useHostStore()
  const [workshops, setWorkshops] = useState<WorkshopMeta[]>([])
  const [selected, setSelected] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.listWorkshops(hostId).then(d => setWorkshops(d as WorkshopMeta[])).catch(()=>{}).finally(()=>setLoading(false))
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-150 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Logo />
        <div className="flex gap-2">
          <button onClick={() => nav('/host/create')} className="btn-primary btn-sm"><Plus className="w-4 h-4" /> New workshop</button>
          <button onClick={() => nav('/')} className="btn-ghost text-sm"><ArrowLeft className="w-4 h-4" /> Home</button>
        </div>
      </nav>

      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* List */}
        <div className="w-72 bg-white border-r border-gray-150 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Your workshops ({workshops.length})</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
          ) : workshops.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No workshops yet</p>
              <button onClick={()=>nav('/host/create')} className="btn-primary btn-sm mt-3">Create one</button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {workshops.map(w => (
                <div key={w.id} onClick={()=>selectWorkshop(w.id)}
                  className={clsx('px-4 py-3.5 cursor-pointer transition-all border-l-2',
                    selected?.id===w.id ? 'bg-brand-50 border-brand-500' : 'border-transparent hover:bg-gray-50')}>
                  <p className="text-sm font-semibold text-gray-800 truncate">{w.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={w.level==='beginner'?'slide':w.level==='intermediate'?'poll':'quiz'}>{w.level}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(w.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 px-6 py-6">
          {detailLoading && <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>}
          {!detailLoading && !selected && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart3 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a workshop to view details</p>
            </div>
          )}
          {!detailLoading && selected && (
            <div className="animate-slide-up">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.content.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selected.topic}</p>
                </div>
                <button onClick={launch} className="btn-primary"><Radio className="w-4 h-4" /> Launch</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label:'Total steps', value: selected.content.steps.length },
                  { label:'Slides', value: selected.content.steps.filter(s=>s.type==='slide').length },
                  { label:'Interactions', value: selected.content.steps.filter(s=>s.type!=='slide').length },
                ].map(stat=>(
                  <div key={stat.label} className="bg-white border border-gray-150 rounded-2xl p-4 text-center shadow-card">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Content outline</p>
              <div className="bg-white border border-gray-150 rounded-2xl shadow-card divide-y divide-gray-100">
                {selected.content.steps.map((s,i)=>(
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs font-mono text-gray-300 w-4">{i+1}</span>
                    <Badge variant={s.type}>{s.type}</Badge>
                    <span className="text-sm text-gray-600 truncate">{s.type==='slide'?s.title:s.question}</span>
                    {s.type==='quiz'&&s.correct_answer!==undefined&&(
                      <span className="ml-auto text-xs text-emerald-600 font-semibold flex-shrink-0">ans: {String.fromCharCode(65+s.correct_answer)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}