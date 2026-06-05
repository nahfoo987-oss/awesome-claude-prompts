import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { TIME_SLOTS } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
  }

  // Block past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = date.split('-').map(Number)
  const requested = new Date(y, m - 1, d)
  if (requested < today) {
    return NextResponse.json({ slots: TIME_SLOTS.map((t) => ({ time: t, available: false, label: t })) })
  }

  const supabase = createServiceClient()

  const { data: booked } = await supabase
    .from('booked_slots')
    .select('time')
    .eq('date', date)

  const bookedTimes = new Set((booked || []).map((r: { time: string }) => r.time))

  // If today, block already-passed times
  const now = new Date()
  const isToday = requested.toDateString() === now.toDateString()

  const slots = TIME_SLOTS.map((time) => {
    let available = !bookedTimes.has(time)

    if (isToday && available) {
      const [hourStr, rest] = time.split(':')
      const [minStr, period] = rest.split(' ')
      let hour = parseInt(hourStr)
      const min = parseInt(minStr)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      const slotTime = new Date()
      slotTime.setHours(hour, min, 0, 0)
      if (slotTime <= now) available = false
    }

    return { time, available, label: time }
  })

  return NextResponse.json({ slots })
}
