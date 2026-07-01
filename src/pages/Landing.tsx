import { useNavigate } from 'react-router-dom'
import { Zap, Users, BarChart3, Sparkles, ArrowRight, BookOpen, LogIn } from 'lucide-react'
import { Logo } from '@/components/ui'
import { useAuthStore } from '@/stores'

export default function Landing() {
  const nav = useNavigate()
  const { user, token } = useAuthStore()
  const dashboardPath = user?.role === 'host' ? '/host/dashboard' : '/attendee/dashboard'
  return (
    <div className="app-shell min-h-screen">
      <nav className="glass-panel border-x-0 border-t-0 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          {token && user ? (
            <button onClick={() => nav(dashboardPath)} className="btn-secondary btn-sm">
              <BookOpen className="w-4 h-4" /> Dashboard
            </button>
          ) : (
            <button onClick={() => nav('/auth')} className="btn-secondary btn-sm">
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}
          <button onClick={() => nav('/auth?role=attendee')} className="btn-secondary btn-sm">Join session</button>
          <button onClick={() => nav('/auth?role=host&mode=signup')} className="btn-primary btn-sm">Create session</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-powered live sessions
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
          Run smarter sessions<br />
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">powered by AI</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Enter a goal. AI builds slides, polls and quizzes in seconds. Attendees join by code. Responses appear live on your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
          <button onClick={() => nav(token && user?.role === 'host' ? '/host/create' : '/auth?role=host&mode=signup')} className="btn-primary text-base px-7 py-3">
            <Zap className="w-4 h-4" /> Host a session <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => nav(token && user?.role === 'attendee' ? '/join' : '/auth?role=attendee')} className="btn-secondary text-base px-7 py-3">
            <Users className="w-4 h-4" /> Join as attendee
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          {[
            { icon: Sparkles, color: 'bg-brand-50 text-brand-500', title: 'AI sessions in seconds', desc: 'Enter a goal and get slides, polls, quizzes, and live interaction instantly.' },
            { icon: Zap,      color: 'bg-amber-50 text-amber-500', title: 'Real-time responses',   desc: 'Attendee answers stream live to your dashboard the moment they submit.' },
            { icon: BarChart3,color: 'bg-emerald-50 text-emerald-500', title: 'Live analytics',    desc: 'See response distributions, accuracy rates and participation in real time.' },
          ].map(f => (
            <div key={f.title} className="card p-6 hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
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
