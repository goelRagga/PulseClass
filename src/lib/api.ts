const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Workshops
  generateWorkshop: (body: {
    topic: string; duration: number; level: string; tone: string; host_id?: string
  }) => req('/workshops/generate', { method: 'POST', body: JSON.stringify(body) }),

  getWorkshop: (id: string) => req(`/workshops/${id}`),

  listWorkshops: (hostId: string) => req(`/workshops/host/${hostId}`),

  updateWorkshop: (id: string, content: unknown) =>
    req(`/workshops/${id}`, { method: 'PUT', body: JSON.stringify(content) }),

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

  getSessionByCode: (code: string) => req(`/sessions/code/${code}`),

  endSession: (sessionId: string) =>
    req(`/sessions/${sessionId}/end`, { method: 'POST' }),

  aiCohost: (sessionId: string, transcript: string) =>
    req(`/sessions/${sessionId}/ai-cohost-trigger`, {
      method: 'POST',
      body: JSON.stringify({ transcript_chunk: transcript, session_id: sessionId }),
    }),
}
