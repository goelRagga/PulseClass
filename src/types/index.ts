export type StepType = 'slide' | 'poll' | 'quiz'

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
