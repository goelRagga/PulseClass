export type StepType = 'slide' | 'poll' | 'quiz'
export type UserRole = 'host' | 'attendee'
export type CreationMode = 'webinar' | 'workshop'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  display_name?: string
  created_at?: string
}

export interface WorkshopStep {
  index: number
  type: StepType
  title?: string
  talking_points?: string[]
  question?: string
  options?: string[]
  correct_answer?: number
  explanation?: string
}

export interface WorkshopContent {
  title: string
  estimated_duration_minutes: number
  steps: WorkshopStep[]
  metadata?: {
    mode?: CreationMode
    project_name?: string
    client_name?: string
    project_description?: string
    business_domain?: string
    workshop_type?: string
    objective?: string
    agenda?: string[]
    discussion_topics?: string[]
    reference_document_name?: string
  }
}

export interface Workshop {
  id: string
  topic: string
  level: string
  content: WorkshopContent
  created_at: string
}

export interface Session {
  id: string
  workshop_id: string
  room_code: string
  status: 'waiting' | 'live' | 'ended'
  current_step_index: number
  participant_count?: number
}

export interface Participant {
  id: string
  session_id: string
  display_name: string
  joined_at: string
}

export interface LiveEvent {
  id: string
  session_id: string
  step_index: number
  type: StepType
  payload: WorkshopStep
  triggered_at: string
}

export interface Response {
  id: string
  event_id: string
  participant_id: string
  answer: string
  is_correct?: boolean
  responded_at: string
}

export interface OptionStat {
  option: string
  count: number
  pct: number
  is_correct: boolean
}

export interface StepResult {
  step_index: number
  type: StepType
  question?: string
  total_responses: number
  accuracy?: number
  options: OptionStat[]
}

export interface Dashboard {
  session_id: string
  room_code: string
  status: string
  current_step_index: number
  participant_count: number
  total_responses: number
  overall_accuracy?: number
  step_results: StepResult[]
}

export interface HostDashboardSession {
  id: string
  room_code: string
  status: 'waiting' | 'live' | 'ended'
  started_at?: string
  ended_at?: string
  current_step_index: number
  workshop_id: string
  mode?: CreationMode
  topic: string
  title: string
  steps: number
  participant_count: number
  response_count: number
  accuracy?: number
}

export interface HostDashboard {
  totals: {
    sessions: number
    live_sessions: number
    attendees: number
    responses: number
    average_accuracy?: number
  }
  sessions: HostDashboardSession[]
}

export interface AttendeeDashboardSession {
  session_id: string
  participant_id: string
  room_code: string
  status: 'waiting' | 'live' | 'ended'
  joined_at: string
  current_step_index: number
  mode?: CreationMode
  topic: string
  title: string
  steps: number
  answers: number
  quiz_correct: number
  quiz_total: number
  accuracy?: number
}

export interface AttendeeDashboard {
  totals: {
    sessions: number
    live_sessions: number
    answers: number
    quiz_correct: number
    quiz_total: number
    average_accuracy?: number
  }
  sessions: AttendeeDashboardSession[]
}
