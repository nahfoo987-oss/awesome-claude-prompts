import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { sendApprovalNotification, sendDeclineNotification } from '@/lib/email'
import type { AppointmentStatus } from '@/types'

const VALID_STATUSES: AppointmentStatus[] = ['pending', 'approved', 'declined', 'completed', 'cancelled']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json() as { status: AppointmentStatus }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: appointment, error } = await service
      .from('appointments')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email notifications for status changes
    if (appointment.customer_email) {
      if (status === 'approved') {
        await sendApprovalNotification({
          customer_name: appointment.customer_name,
          customer_email: appointment.customer_email,
          service: appointment.service,
          date: appointment.date,
          time: appointment.time,
        }).catch(console.error)
      } else if (status === 'declined') {
        await sendDeclineNotification({
          customer_name: appointment.customer_name,
          customer_email: appointment.customer_email,
          service: appointment.service,
          date: appointment.date,
          time: appointment.time,
        }).catch(console.error)
      }
    }

    return NextResponse.json({ appointment })
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
