import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { appointmentSchema } from '@/lib/validations'
import { sendBarberNotification, sendCustomerConfirmation } from '@/lib/email'

// POST /api/appointments — public, creates a new appointment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = appointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Use service client to bypass RLS for the insert
    // (anon policy allows insert, but service client ensures reliability)
    const supabase = createServiceClient()

    // Check for double booking
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('date', data.date)
      .eq('time', data.time)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'That time slot is no longer available. Please choose another.' },
        { status: 409 }
      )
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        service: data.service,
        date: data.date,
        time: data.time,
        notes: data.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save appointment.' }, { status: 500 })
    }

    // Send notifications (non-blocking — don't fail if email fails)
    await Promise.allSettled([
      sendBarberNotification({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        service: data.service,
        date: data.date,
        time: data.time,
        notes: data.notes,
      }),
      data.customer_email
        ? sendCustomerConfirmation({
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            service: data.service,
            date: data.date,
            time: data.time,
          })
        : Promise.resolve(),
    ])

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    console.error('POST /api/appointments error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// GET /api/appointments — admin only
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const service = createServiceClient()
    let query = service
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments: data })
  } catch (err) {
    console.error('GET /api/appointments error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
