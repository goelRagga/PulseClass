import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, BarChart3, CheckCircle2, Loader2, Lock, Mail, Radio, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores'
import type { AuthUser, UserRole } from '@/types'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'host' ? 'host' : 'attendee'
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [role, setRole] = useState<UserRole>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, token, setAuth } = useAuthStore()
  const roleDescription = role === 'host'
    ? 'Orchestrate live sessions, manage rooms, and unlock performance analytics.'
    : 'Join live rooms and track your learning journey in real time.'

  if (token && user) {
    return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/attendee/dashboard'} replace />
  }

  const submit = async () => {
    if (!email.trim()) { setError('Enter your email.'); return }
    if (password.length < (mode === 'signup' ? 8 : 1)) {
      setError(mode === 'signup' ? 'Password must be at least 8 characters.' : 'Enter your password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await (mode === 'signup'
        ? api.signup({ email, password, role, display_name: displayName || undefined })
        : api.login({ email, password, role })) as { access_token: string; user: AuthUser }
      setAuth(res.user, res.access_token)
      nav(role === 'host' ? '/host/dashboard' : '/attendee/dashboard', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr] bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-violet-400/25 to-fuchsia-400/15 blur-3xl" />
      </div>

      {/* left visual panel */}
      <section className="relative hidden lg:flex min-h-[100dvh] overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#4f46e5_0%,#312e81_45%,#0f172a_100%)]" />
        <div className="absolute inset-0 opacity-[0.15] bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-violet-500/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-sky-400/30 to-transparent blur-3xl" />

        <div className="relative z-[1] flex min-h-[100dvh] w-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-white">
            <Logo size="md" hide={true} />
            <span className="text-lg">IntelliMeet</span>
          </div>

          <div className="max-w-xl animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xl shadow-lg shadow-indigo-950/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Enterprise-grade session platform
            </div>
            <h1 className="mt-7 text-4xl xl:text-[3.25rem] font-bold leading-[1.05] tracking-tight">
              Live learning, <span className="bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent">orchestrated</span> with intelligence.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
              Trusted by consulting teams to run high-signal workshops, polls, and quizzes — with realtime analytics baked in.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Radio, label: 'Live rooms', value: 'Realtime' },
              { icon: BarChart3, label: 'Analytics', value: 'Tracked' },
              { icon: Users, label: 'Roles', value: 'Separated' },
            ].map(item => (
              <div key={item.label} className="group rounded-3xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-xl hover:bg-white/[0.12] transition-all duration-300 hover:-translate-y-0.5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-bold">{item.value}</p>
                <p className="mt-0.5 text-xs text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* right form panel */}
      <main className="relative z-[1] flex min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="lg:hidden"><Logo /></div>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur-xl">
              {(['login', 'signup'] as const).map(item => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={clsx(
                    'rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.98]',
                    mode === item
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {item === 'login' ? 'Login' : 'Sign up'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/60 bg-white/70 p-6 md:p-8 shadow-[0_20px_70px_-20px_rgba(79,70,229,0.25)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

            <div className="mb-5">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                {mode === 'signup' ? <UserPlus className="h-5 w-5 text-white" /> : <Lock className="h-5 w-5 text-white" />}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-1.5 min-h-[2.5rem] text-sm leading-snug text-slate-500">
                {roleDescription}
              </p>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Account type</p>
              <p className="text-xs text-slate-400">{mode === 'signup' ? 'Choose before creating' : 'Choose before login'}</p>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-2.5">
              {([
                { id: 'attendee' as UserRole, label: 'Attendee', desc: 'Join sessions', icon: CheckCircle2 },
                { id: 'host' as UserRole, label: 'Host', desc: 'Run sessions', icon: Sparkles },
              ]).map(item => (
                <button
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={clsx(
                    'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98]',
                    role === item.id
                      ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-md shadow-indigo-500/10'
                      : 'border-slate-200 bg-white/70 hover:border-indigo-200 hover:bg-white'
                  )}
                >
                  {role === item.id && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]" />
                  )}
                  <span className={clsx(
                    'mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                    role === item.id
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  )}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className={clsx('block text-sm font-bold', role === item.id ? 'text-indigo-700' : 'text-slate-800')}>
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-sm text-red-600 backdrop-blur">
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="label">Display name</label>
                  <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Alex Morgan" />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input className="input pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="input pl-10"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Your password'}
                  />
                </div>
              </div>
              <button
                onClick={submit}
                disabled={loading}
                className="group relative mt-2 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="relative">{mode === 'signup' ? 'Create account' : 'Sign in securely'}</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              <span>End-to-end encrypted · SOC 2 aligned infrastructure</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
