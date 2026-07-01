import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, BarChart3, CheckCircle2, Loader2, Lock, Mail, Radio, ShieldCheck, UserPlus, Users } from 'lucide-react'
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
    ? 'Access session creation, live rooms and performance dashboards.'
    : 'Join live rooms and review your learning activity.'

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
    <div className="app-shell min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden lg:flex min-h-[100dvh] overflow-hidden bg-slate-900 text-white">
        <img
          src="https://res.cloudinary.com/dvbdvkhs/image/upload/v1782943870/lucid-origin_Ultra-premium_AI_meeting_management_dashboard_sexy_high-end_enterprise_analytics-0_jkxlqn.jpg"
          alt="Session operations workspace"
          className="absolute inset-0 h-full w-full object-cover "
        />
        <div className="absolute inset-0 bg-slate-800/70" />
        <div className="relative z-[1] flex min-h-[100dvh] w-full flex-col justify-between p-10 xl:p-12">
          <div className="flex items-center gap-2 font-bold tracking-tight text-white">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-2xl bg-white">
              <Activity className="h-4 w-4 text-brand-600" />
            </div>
            IntelliMeet
          </div>

          <div className="max-w-xl animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure session access
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Run live learning with account-level control.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/78">
              Hosts manage sessions and analytics. Attendees join sessions and keep their participation history.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Radio, label: 'Live rooms', value: 'Realtime' },
              { icon: BarChart3, label: 'Analytics', value: 'Tracked' },
              { icon: Users, label: 'Roles', value: 'Separated' },
            ].map(item => (
              <div key={item.label} className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-md">
                <item.icon className="mb-3 h-5 w-5 text-white" />
                <p className="text-sm font-bold">{item.value}</p>
                <p className="mt-0.5 text-xs text-white/62">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm backdrop-blur-xl">
              {(['login', 'signup'] as const).map(item => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={clsx(
                    'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-[0.98]',
                    mode === item
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-slate-50 hover:text-gray-800'
                  )}
                >
                  {item === 'login' ? 'Login' : 'Sign up'}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel flex min-h-[560px] flex-col p-6 md:p-7">
            <div className="mb-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50">
                {mode === 'signup' ? <UserPlus className="h-5 w-5 text-brand-500" /> : <Lock className="h-5 w-5 text-brand-500" />}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {mode === 'signup' ? 'Create your account' : 'Sign in to IntelliMeet'}
              </h2>
              <p className="mt-1.5 min-h-[2.5rem] text-sm leading-snug text-gray-500">
                {roleDescription}
              </p>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Account type</p>
              <p className="text-xs text-gray-400">{mode === 'signup' ? 'Choose before creating' : 'Choose before login'}</p>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {([
                { id: 'attendee' as UserRole, label: 'User', desc: 'Join sessions', icon: CheckCircle2 },
                { id: 'host' as UserRole, label: 'Host', desc: 'Run sessions', icon: Activity },
              ]).map(item => (
                <button
                  key={item.id}
                  onClick={() => setRole(item.id)}
                  className={clsx(
                    'rounded-2xl border p-3 text-left transition-all active:scale-[0.98]',
                    role === item.id
                      ? 'border-brand-300 bg-brand-50/80 shadow-sm'
                      : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-white'
                  )}
                >
                  <span className={clsx(
                    'mb-2 flex h-8 w-8 items-center justify-center rounded-xl border',
                    role === item.id ? 'border-brand-200 bg-white text-brand-600' : 'border-slate-200 bg-slate-50 text-gray-400'
                  )}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className={clsx('block text-sm font-bold', role === item.id ? 'text-brand-700' : 'text-gray-800')}>
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-400">{item.desc}</span>
                </button>
              ))}
            </div>

            {error && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="flex flex-1 flex-col space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="label">Display name</label>
                  <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Alex Morgan" />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-300" />
                  <input className="input pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-300" />
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
              <button onClick={submit} disabled={loading} className="btn-primary mt-auto w-full justify-center py-2.5">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signup' ? 'Create account' : 'Login'}
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] leading-snug text-gray-400">
              Passwords are hashed server-side and protected with a signed token.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
