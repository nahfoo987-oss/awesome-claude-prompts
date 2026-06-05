'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay, isSameMonth, isSameDay } from 'date-fns'
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations'
import type { TimeSlot } from '@/types'
import { cn } from '@/lib/utils'

const SERVICES = ['Any Cut — $30']

type Step = 'datetime' | 'details' | 'success'

export default function BookingForm() {
  const [step, setStep] = useState<Step>('datetime')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const [submitting, setSubmitting] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { service: 'Any Cut — $30' },
  })

  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true)
    setSlots([])
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/available-slots?date=${dateStr}`)
      const { slots } = await res.json()
      setSlots(slots || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      setSelectedTime('')
      setValue('time', '')
      fetchSlots(selectedDate)
    }
  }, [selectedDate, fetchSlots, setValue])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setValue('date', format(date, 'yyyy-MM-dd'))
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setValue('time', time)
  }

  const onSubmit = async (data: AppointmentFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error || 'Something went wrong. Please try again.')
        return
      }
      setBookingRef(json.appointment?.id?.slice(0, 8).toUpperCase() || 'CONF')
      setStep('success')
    } catch {
      alert('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const today = startOfDay(new Date())
  const monthStart = startOfMonth(calMonth)
  const monthEnd = endOfMonth(calMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart) // 0=Sun

  const canPrevMonth = !isSameMonth(calMonth, today) &&
    !isBefore(subMonths(calMonth, 1), startOfMonth(today))

  if (step === 'success') {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-border rounded-full mb-6">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4.5 4.5L16 7" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[9px] tracking-[0.3em] uppercase text-stone-400 mb-2">Booking Received</p>
        <h2 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">You're on the list.</h2>
        <p className="text-sm text-stone-500 mb-2">
          Reference: <span className="font-mono text-text-primary">{bookingRef}</span>
        </p>
        <p className="text-sm text-stone-500 max-w-sm mx-auto mb-8">
          Your appointment is pending confirmation. You'll receive an email once it's approved.
        </p>
        <button
          onClick={() => { setStep('datetime'); setSelectedDate(null); setSelectedTime('') }}
          className="text-[10px] tracking-[0.15em] uppercase text-stone-500 border-b border-stone-300 pb-px hover:text-text-primary hover:border-text-primary transition-colors"
        >
          Book Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-10">
        {['Select Date & Time', 'Your Details'].map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border transition-colors',
                  step === (i === 0 ? 'datetime' : 'details')
                    ? 'bg-text-primary border-text-primary text-background'
                    : i === 0 && step === 'details'
                    ? 'bg-text-primary border-text-primary text-background'
                    : 'border-border text-stone-400'
                )}
              >
                {i === 0 && step === 'details' ? '✓' : i + 1}
              </span>
              <span className={cn(
                'text-[10px] tracking-[0.1em] uppercase hidden sm:block',
                step === (i === 0 ? 'datetime' : 'details') ? 'text-text-primary' : 'text-stone-400'
              )}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden fields */}
        <input type="hidden" {...register('date')} />
        <input type="hidden" {...register('time')} />
        <input type="hidden" {...register('service')} value="Any Cut — $30" />

        {step === 'datetime' && (
          <div className="animate-slide-up">
            {/* Calendar */}
            <div className="bg-white border border-border rounded-sm p-6 mb-4">
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => canPrevMonth && setCalMonth(subMonths(calMonth, 1))}
                  disabled={!canPrevMonth}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded transition-colors text-lg',
                    canPrevMonth ? 'hover:bg-stone-100 text-text-primary' : 'text-stone-200 cursor-not-allowed'
                  )}
                >
                  ‹
                </button>
                <p className="text-sm font-medium tracking-wide">
                  {format(calMonth, 'MMMM yyyy')}
                </p>
                <button
                  type="button"
                  onClick={() => setCalMonth(addMonths(calMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-100 transition-colors text-lg"
                >
                  ›
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="text-center text-[10px] text-stone-400 tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-y-1">
                {/* Padding */}
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map((day) => {
                  const isPast = isBefore(day, today)
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const isToday = isSameDay(day, today)

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        'relative w-full aspect-square flex items-center justify-center text-sm rounded-sm transition-colors',
                        isPast && 'text-stone-200 cursor-not-allowed',
                        !isPast && !isSelected && 'hover:bg-stone-100 text-text-primary',
                        isSelected && 'bg-text-primary text-background',
                        isToday && !isSelected && 'font-semibold'
                      )}
                    >
                      {format(day, 'd')}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white border border-border rounded-sm p-6 animate-slide-up">
                <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-4">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </p>

                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border border-border border-t-stone-400 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        className={cn(
                          'py-2.5 px-2 text-[11px] border rounded-sm transition-colors font-medium',
                          !slot.available && 'border-stone-100 text-stone-200 bg-stone-50 cursor-not-allowed line-through',
                          slot.available && selectedTime !== slot.time && 'border-border text-text-primary hover:border-stone-400 hover:bg-stone-50',
                          selectedTime === slot.time && 'bg-text-primary border-text-primary text-background'
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.date && <p className="text-red-500 text-xs mt-2">{errors.date.message}</p>}
            {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}

            <button
              type="button"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep('details')}
              className={cn(
                'w-full mt-6 py-4 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors',
                selectedDate && selectedTime
                  ? 'bg-text-primary text-background hover:bg-stone-800'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              )}
            >
              Continue
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="animate-slide-up">
            <div className="bg-white border border-border rounded-sm p-2 mb-6 flex items-center justify-between">
              <div className="px-4 py-2">
                <p className="text-[9px] text-stone-400 uppercase tracking-widest mb-0.5">Selected</p>
                <p className="text-sm font-medium text-text-primary">
                  {selectedDate && format(selectedDate, 'EEE, MMM d')} · {selectedTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('datetime')}
                className="px-4 py-2 text-[10px] tracking-wider uppercase text-stone-400 hover:text-text-primary transition-colors"
              >
                Change
              </button>
            </div>

            <div className="bg-white border border-border rounded-sm p-6 space-y-5">
              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('customer_name')}
                  placeholder="Your name"
                  className={cn(
                    'w-full px-4 py-3 border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300',
                    errors.customer_name ? 'border-red-300' : 'border-border'
                  )}
                />
                {errors.customer_name && (
                  <p className="text-red-400 text-[11px] mt-1">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('customer_phone')}
                  type="tel"
                  placeholder="(323) 000-0000"
                  className={cn(
                    'w-full px-4 py-3 border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300',
                    errors.customer_phone ? 'border-red-300' : 'border-border'
                  )}
                />
                {errors.customer_phone && (
                  <p className="text-red-400 text-[11px] mt-1">{errors.customer_phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                  Email <span className="text-stone-300 text-[9px] normal-case tracking-normal">(for confirmation)</span>
                </label>
                <input
                  {...register('customer_email')}
                  type="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full px-4 py-3 border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300',
                    errors.customer_email ? 'border-red-300' : 'border-border'
                  )}
                />
                {errors.customer_email && (
                  <p className="text-red-400 text-[11px] mt-1">{errors.customer_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                  Service
                </label>
                <div className="w-full px-4 py-3 border border-border bg-stone-50 text-sm text-stone-500 rounded-sm">
                  Any Cut — $30
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.15em] uppercase text-stone-500 mb-2">
                  Notes <span className="text-stone-300 text-[9px] normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Any specific requests, style references, etc."
                  className="w-full px-4 py-3 border border-border text-sm bg-background rounded-sm focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-300 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full mt-6 py-4 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors',
                submitting
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-text-primary text-background hover:bg-stone-800'
              )}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>

            <p className="text-center text-[10px] text-stone-400 mt-4">
              Your appointment will be confirmed via email.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
