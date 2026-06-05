'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatDateShort } from '@/lib/utils'
import StatusBadge from './StatusBadge'
import type { Appointment, AppointmentStatus } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'pending' | 'approved' | 'completed'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
]

const ACTION_BUTTONS: { status: AppointmentStatus; label: string; className: string }[] = [
  { status: 'approved', label: 'Approve', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' },
  { status: 'declined', label: 'Decline', className: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' },
  { status: 'completed', label: 'Complete', className: 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' },
  { status: 'cancelled', label: 'Cancel', className: 'bg-stone-50 text-stone-400 border border-stone-200 hover:bg-stone-100' },
]

function actionsForStatus(status: AppointmentStatus) {
  if (status === 'pending') return ACTION_BUTTONS.filter((a) => ['approved', 'declined'].includes(a.status))
  if (status === 'approved') return ACTION_BUTTONS.filter((a) => ['completed', 'cancelled'].includes(a.status))
  return []
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = tab !== 'all' ? `?status=${tab}` : ''
      const res = await fetch(`/api/appointments${params}`)
      const json = await res.json()
      setAppointments(json.appointments || [])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  // Stats
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const allAppts = appointments
  const pending = allAppts.filter((a) => a.status === 'pending')
  const thisWeek = allAppts.filter((a) => {
    const d = new Date(a.date + 'T00:00:00')
    return d >= weekStart && d <= now
  })
  const thisMonth = allAppts.filter((a) => {
    const d = new Date(a.date + 'T00:00:00')
    return d >= monthStart
  })
  const revenue = allAppts.filter((a) => a.status === 'completed').length * 30

  const stats = [
    { label: 'This Week', value: thisWeek.length },
    { label: 'This Month', value: thisMonth.length },
    { label: 'Pending', value: pending.length },
    { label: 'Est. Revenue', value: `$${revenue}` },
  ]

  const upcoming = allAppts
    .filter((a) => {
      const d = new Date(a.date + 'T00:00:00')
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
        ['pending', 'approved'].includes(a.status)
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <p className="text-[11px] tracking-[0.2em] uppercase font-medium">
            Ghost LA Blendz <span className="text-stone-400 ml-1">/ Admin</span>
          </p>
          <button
            onClick={handleSignOut}
            className="text-[10px] tracking-[0.15em] uppercase text-stone-400 hover:text-text-primary transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-border rounded-sm p-5">
              <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-serif text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="bg-white border border-border rounded-sm p-5 mb-6">
            <p className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-4">Upcoming</p>
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center min-w-[40px]">
                      <p className="text-[9px] text-stone-400 uppercase">{formatDateShort(a.date).split(' ')[0]}</p>
                      <p className="text-lg font-serif leading-none">{formatDateShort(a.date).split(' ')[1]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.customer_name}</p>
                      <p className="text-[11px] text-stone-400">{a.time}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border border-border rounded-sm overflow-hidden mb-4">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'flex-1 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors',
                tab === t.value
                  ? 'bg-text-primary text-background'
                  : 'bg-white text-stone-500 hover:bg-stone-50'
              )}
            >
              {t.label}
              {t.value === 'pending' && pending.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px]">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointment list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border border-border border-t-stone-400 rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-sm">No appointments{tab !== 'all' ? ` with status "${tab}"` : ''}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white border border-border rounded-sm p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-text-primary">{appt.customer_name}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {formatDate(appt.date)} · {appt.time}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] mb-4">
                  <div>
                    <span className="text-stone-400 uppercase tracking-wider text-[9px]">Phone</span>
                    <p className="text-text-primary mt-0.5">
                      <a href={`tel:${appt.customer_phone}`} className="hover:underline">
                        {appt.customer_phone}
                      </a>
                    </p>
                  </div>
                  {appt.customer_email && (
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider text-[9px]">Email</span>
                      <p className="text-text-primary mt-0.5 truncate">
                        <a href={`mailto:${appt.customer_email}`} className="hover:underline">
                          {appt.customer_email}
                        </a>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-stone-400 uppercase tracking-wider text-[9px]">Service</span>
                    <p className="text-text-primary mt-0.5">{appt.service}</p>
                  </div>
                </div>

                {appt.notes && (
                  <div className="mb-4 px-3 py-2.5 bg-stone-50 rounded-sm border border-border">
                    <span className="text-[9px] text-stone-400 uppercase tracking-wider">Notes</span>
                    <p className="text-[12px] text-stone-600 mt-0.5 italic">"{appt.notes}"</p>
                  </div>
                )}

                {/* Actions */}
                {actionsForStatus(appt.status).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {actionsForStatus(appt.status).map((action) => (
                      <button
                        key={action.status}
                        disabled={updating === appt.id}
                        onClick={() => updateStatus(appt.id, action.status)}
                        className={cn(
                          'px-4 py-1.5 text-[10px] tracking-[0.1em] uppercase rounded-sm font-medium transition-colors disabled:opacity-50',
                          action.className
                        )}
                      >
                        {updating === appt.id ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[9px] text-stone-300 mt-3">
                  ID: {appt.id.slice(0, 8)} · Booked {new Date(appt.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
