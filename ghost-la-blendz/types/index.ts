export type AppointmentStatus = 'pending' | 'approved' | 'declined' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service: string
  date: string
  time: string
  notes?: string
  status: AppointmentStatus
  created_at: string
}

export interface TimeSlot {
  time: string
  available: boolean
  label: string
}

export interface DashboardStats {
  thisWeek: number
  thisMonth: number
  pending: number
  revenue: number
}
