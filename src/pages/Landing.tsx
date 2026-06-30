import { useNavigate } from 'react-router-dom'
import { Zap, Users, BarChart3, Sparkles, ArrowRight, BookOpen, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/ui'

export default function Landing() {
  const nav = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/host/workshops')} className="btn-ghost text-sm">
            <BookOpen className="w-4 h-4" /> My workshops
          </button>
          <button onClick={() => nav('/join')} className="btn-secondary btn-sm">Join session</button>
          <button onClick={() => nav('/host/create')} className="btn-primary btn-sm">
            Create workshop
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-powered live workshops
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
          Run smarter workshops<br />
          <span className="text-brand-500">powered by AI</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Enter a topic — AI builds slides, polls and quizzes in seconds. Attendees join by code. Responses appear live on your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
          <button onClick={() => nav('/host/create')} className="btn-primary text-base px-7 py-3">
            <Zap className="w-4 h-4" /> Host a workshop <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => nav('/join')} className="btn-secondary text-base px-7 py-3">
            <Users className="w-4 h-4" /> Join as attendee
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          {[
            { icon: Sparkles, color: 'bg-brand-50 text-brand-500', title: 'AI content in seconds', desc: 'Enter any topic and get a complete workshop — slides, polls, quizzes — instantly.' },
            { icon: Zap,      color: 'bg-amber-50 text-amber-500', title: 'Real-time responses',   desc: 'Attendee answers stream live to your dashboard the moment they submit.' },
            { icon: BarChart3,color: 'bg-emerald-50 text-emerald-500', title: 'Live analytics',    desc: 'See response distributions, accuracy rates and participation in real time.' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-card hover:shadow-card-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-900 mb-1.5">{f.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}