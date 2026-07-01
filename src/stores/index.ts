import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, Workshop, Session, WorkshopStep } from '@/types'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'intellimeet-auth' }
  )
)

interface HostStore {
  workshop: Workshop | null
  session: Session | null
  currentStep: number
  responses: Record<number, Record<number, number>> // stepIdx -> optionIdx -> count
  participantCount: number
  hostId: string

  setWorkshop: (w: Workshop) => void
  setSession: (s: Session) => void
  setCurrentStep: (i: number) => void
  addResponse: (stepIdx: number, optionIdx: number) => void
  incrementParticipant: () => void
  resetHost: () => void
}

interface AttendeeStore {
  participantId: string | null
  sessionId: string | null
  roomCode: string | null
  displayName: string
  workshop: { steps: WorkshopStep[]; title: string } | null
  currentStep: number
  myAnswers: Record<number, number> // stepIdx -> optionIdx
  currentEventId: string | null

  setParticipant: (id: string) => void
  setSession: (id: string, code: string) => void
  setDisplayName: (name: string) => void
  setWorkshop: (w: AttendeeStore['workshop']) => void
  setCurrentStep: (i: number, eventId?: string) => void
  submitAnswer: (stepIdx: number, optionIdx: number) => void
  resetAttendee: () => void
}

const randomId = () => Math.random().toString(36).slice(2, 10)

export const useHostStore = create<HostStore>()(
  persist(
    (set) => ({
      workshop: null,
      session: null,
      currentStep: 0,
      responses: {},
      participantCount: 0,
      hostId: randomId(),

      setWorkshop: (w) => set({ workshop: w }),
      setSession: (s) => set({ session: s, currentStep: 0, responses: {}, participantCount: 0 }),
      setCurrentStep: (i) => set({ currentStep: i }),
      addResponse: (stepIdx, optionIdx) =>
        set((state) => {
          const step = { ...state.responses[stepIdx] }
          step[optionIdx] = (step[optionIdx] || 0) + 1
          return { responses: { ...state.responses, [stepIdx]: step } }
        }),
      incrementParticipant: () =>
        set((state) => ({ participantCount: state.participantCount + 1 })),
      resetHost: () =>
        set({ workshop: null, session: null, currentStep: 0, responses: {}, participantCount: 0 }),
    }),
    { name: 'intellimeet-host', partialize: (s) => ({ hostId: s.hostId }) }
  )
)

export const useAttendeeStore = create<AttendeeStore>()((set) => ({
  participantId: null,
  sessionId: null,
  roomCode: null,
  displayName: '',
  workshop: null,
  currentStep: 0,
  myAnswers: {},
  currentEventId: null,

  setParticipant: (id) => set({ participantId: id }),
  setSession: (id, code) => set({ sessionId: id, roomCode: code }),
  setDisplayName: (name) => set({ displayName: name }),
  setWorkshop: (w) => set({ workshop: w }),
  setCurrentStep: (i, eventId) => set({ currentStep: i, currentEventId: eventId || null }),
  submitAnswer: (stepIdx, optionIdx) =>
    set((state) => ({ myAnswers: { ...state.myAnswers, [stepIdx]: optionIdx } })),
  resetAttendee: () =>
    set({
      participantId: null, sessionId: null, roomCode: null,
      workshop: null, currentStep: 0, myAnswers: {}, currentEventId: null
    }),
}))
