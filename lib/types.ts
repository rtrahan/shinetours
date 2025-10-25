export type TourStatus = 'Ungrouped' | 'Pending' | 'Ready' | 'PendingYale' | 'Confirmed' | 'Completed'

export interface Guide {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  is_admin: boolean
  is_active: boolean
  languages: string[]
  created_at: string
  updated_at: string
}

export interface TourGroup {
  id: string
  requested_date: string
  confirmed_datetime: string | null
  status: TourStatus
  guide_id: string | null
  created_at: string
  updated_at: string
  guide?: Guide
  booking_requests?: BookingRequest[]
}

export interface BookingRequest {
  id: string
  requested_date: string
  group_size: number
  contact_name: string
  contact_email: string
  contact_phone: string
  preferred_guide_id: string | null
  preferred_language: string
  tour_group_id: string | null
  created_at: string
  updated_at: string
  preferred_guide?: Guide
  tour_group?: TourGroup
}

export interface TourSettings {
  id: string
  available_days_of_week: string | null
  updated_by_user_id: string | null
  last_updated: string
}

