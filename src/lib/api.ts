const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getStoredToken() {
  try {
    const raw = localStorage.getItem('intellimeet-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.token || null
  } catch {
    return null
  }
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  signup: (body: {
    email: string; password: string; role: 'host' | 'attendee'; display_name?: string
  }) => req('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: {
    email: string; password: string; role: 'host' | 'attendee'
  }) => req('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => req('/auth/me'),

  // Workshops
  generateWorkshop: (body: {
    topic: string
    duration: number
    level: string
    tone: string
    host_id?: string
    mode?: 'webinar' | 'workshop'
    project_name?: string
    client_name?: string
    project_description?: string
    business_domain?: string
    workshop_type?: string
    objective?: string
    agenda?: string[]
    discussion_topics?: string[]
    reference_document_name?: string
    reference_document_content?: string
  }) => req('/workshops/generate', { method: 'POST', body: JSON.stringify(body) }),

  getWorkshop: (id: string) => req(`/workshops/${id}`),

  listWorkshops: (_hostId?: string) => req('/workshops/host/me'),

  updateWorkshop: (id: string, content: unknown) =>
    req(`/workshops/${id}`, { method: 'PUT', body: JSON.stringify(content) }),

  suggestWorkshop: (title: string, steps: unknown[]) =>
    req('/workshops/suggest', { method: 'POST', body: JSON.stringify({ title, steps }) }),

  // Sessions
  startSession: (workshopId: string, hostId?: string) =>
    req('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ workshop_id: workshopId, host_id: hostId }),
    }),

  setLive: (sessionId: string) =>
    req(`/sessions/${sessionId}/live`, { method: 'POST' }),

  joinSession: (code: string, displayName: string) =>
    req(`/sessions/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ room_code: code, display_name: displayName }),
    }),

  nextStep: (sessionId: string) =>
    req(`/sessions/${sessionId}/next`, { method: 'POST', body: JSON.stringify({}) }),

  submitAnswer: (sessionId: string, body: {
    event_id: string; participant_id: string; answer: string; is_correct?: boolean
  }) => req(`/sessions/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(body) }),

  getDashboard: (sessionId: string) => req(`/sessions/${sessionId}/dashboard`),

  getHostDashboard: () => req('/sessions/host/dashboard'),

  getAttendeeDashboard: () => req('/sessions/attendee/dashboard'),

  getSessionByCode: (code: string) => req(`/sessions/code/${code}`),

  endSession: (sessionId: string) =>
    req(`/sessions/${sessionId}/end`, { method: 'POST' }),

  aiCohost: (sessionId: string, transcript: string) =>
    req(`/sessions/${sessionId}/ai-cohost-trigger`, {
      method: 'POST',
      body: JSON.stringify({ transcript_chunk: transcript, session_id: sessionId }),
    }),
}
