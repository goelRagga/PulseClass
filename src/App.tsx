import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'
import HostCreate from '@/pages/HostCreate'
import HostSetup from '@/pages/HostSetup'
import HostLive from '@/pages/HostLive'
import AttendeeJoin from '@/pages/AttendeeJoin'
import AttendeeWaiting from '@/pages/AttendeeWaiting'
import AttendeeLive from '@/pages/AttendeeLive'
import HostDashboard from '@/pages/HostDashboard'
import AttendeeDashboard from '@/pages/AttendeeDashboard'
import HostWorkshops from './pages/HostWorkshops'
import { useAuthStore } from '@/stores'
import type { UserRole } from '@/types'

function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to={`/auth?role=${role}`} replace />
  if (user.role !== role) return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/attendee/dashboard'} replace />
  return <>{children}</>
}

function HomeRedirect() {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/auth" replace />
  return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/attendee/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/host/dashboard" element={<RequireRole role="host"><HostDashboard /></RequireRole>} />
        <Route path="/host/create" element={<RequireRole role="host"><HostCreate /></RequireRole>} />
        <Route path="/host/workshops" element={<RequireRole role="host"><HostWorkshops /></RequireRole>} />
        <Route path="/host/setup/:workshopId" element={<RequireRole role="host"><HostSetup /></RequireRole>} />
        <Route path="/host/live/:sessionId" element={<RequireRole role="host"><HostLive /></RequireRole>} />
        <Route path="/attendee/dashboard" element={<RequireRole role="attendee"><AttendeeDashboard /></RequireRole>} />
        <Route path="/join" element={<RequireRole role="attendee"><AttendeeJoin /></RequireRole>} />
        <Route path="/attendee/waiting" element={<RequireRole role="attendee"><AttendeeWaiting /></RequireRole>} />
        <Route path="/attendee/live" element={<RequireRole role="attendee"><AttendeeLive /></RequireRole>} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
