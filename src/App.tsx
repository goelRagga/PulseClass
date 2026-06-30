import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '@/pages/Landing'
import HostCreate from '@/pages/HostCreate'
import HostSetup from '@/pages/HostSetup'
import HostLive from '@/pages/HostLive'
import AttendeeJoin from '@/pages/AttendeeJoin'
import AttendeeWaiting from '@/pages/AttendeeWaiting'
import AttendeeLive from '@/pages/AttendeeLive'
import HostWorkshops from './pages/HostWorkshops'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host/create" element={<HostCreate />} />
        <Route path="/host/workshops" element={<HostWorkshops />} />
        <Route path="/host/setup/:workshopId" element={<HostSetup />} />
        <Route path="/host/live/:sessionId" element={<HostLive />} />
        <Route path="/join" element={<AttendeeJoin />} />
        <Route path="/attendee/waiting" element={<AttendeeWaiting />} />
        <Route path="/attendee/live" element={<AttendeeLive />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}