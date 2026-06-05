import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const BARBER_EMAIL = process.env.BARBER_EMAIL || 'ghost@ghostlablendz.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'bookings@ghostlablendz.com'

function appointmentBlock(a: {
  customer_name: string
  service: string
  date: string
  time: string
  customer_phone?: string
  notes?: string
}) {
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <tr><td style="padding:10px 0;border-bottom:1px solid #e7e2db;font-weight:600;width:140px;color:#111;">Name</td><td style="padding:10px 0;border-bottom:1px solid #e7e2db;color:#444;">${a.customer_name}</td></tr>
      ${a.customer_phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e7e2db;font-weight:600;color:#111;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e7e2db;color:#444;">${a.customer_phone}</td></tr>` : ''}
      <tr><td style="padding:10px 0;border-bottom:1px solid #e7e2db;font-weight:600;color:#111;">Service</td><td style="padding:10px 0;border-bottom:1px solid #e7e2db;color:#444;">${a.service}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e7e2db;font-weight:600;color:#111;">Date</td><td style="padding:10px 0;border-bottom:1px solid #e7e2db;color:#444;">${a.date}</td></tr>
      <tr><td style="padding:10px 0;font-weight:600;color:#111;">Time</td><td style="padding:10px 0;color:#444;">${a.time}</td></tr>
      ${a.notes ? `<tr><td colspan="2" style="padding:10px 0;border-top:1px solid #e7e2db;color:#666;font-style:italic;">"${a.notes}"</td></tr>` : ''}
    </table>
  `
}

function emailWrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;padding:0 16px 40px;">
        <div style="margin-bottom:32px;">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#78716C;margin:0 0 4px;">Ghost LA Blendz</p>
          <p style="font-size:12px;color:#A8A099;margin:0;">Clean. Consistent. Precision.</p>
        </div>
        <div style="background:#fff;border:1px solid #E7E2DB;border-radius:4px;padding:32px;">
          ${content}
        </div>
        <p style="font-size:11px;color:#A8A099;margin-top:24px;text-align:center;">Los Angeles, California</p>
      </div>
    </body>
    </html>
  `
}

export async function sendBarberNotification(appointment: {
  customer_name: string
  customer_phone: string
  customer_email?: string
  service: string
  date: string
  time: string
  notes?: string
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: BARBER_EMAIL,
      subject: `New Booking — ${appointment.customer_name} · ${appointment.date} at ${appointment.time}`,
      html: emailWrapper(`
        <h1 style="font-size:18px;font-weight:600;color:#111;margin:0 0 4px;">New Appointment Request</h1>
        <p style="font-size:13px;color:#78716C;margin:0 0 24px;">Log in to your dashboard to approve or decline.</p>
        ${appointmentBlock(appointment)}
        ${appointment.customer_email ? `<p style="margin-top:16px;font-size:13px;color:#78716C;">Reply to: ${appointment.customer_email}</p>` : ''}
      `),
    })
  } catch (err) {
    console.error('Failed to send barber notification:', err)
  }
}

export async function sendCustomerConfirmation(appointment: {
  customer_name: string
  customer_email: string
  service: string
  date: string
  time: string
}) {
  if (!appointment.customer_email) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.customer_email,
      subject: `Booking Received — Ghost LA Blendz`,
      html: emailWrapper(`
        <h1 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px;">We got your request.</h1>
        <p style="font-size:14px;color:#78716C;margin:0 0 24px;">Your appointment is <strong>pending confirmation</strong>. You'll hear back once it's approved.</p>
        ${appointmentBlock(appointment)}
      `),
    })
  } catch (err) {
    console.error('Failed to send customer confirmation:', err)
  }
}

export async function sendApprovalNotification(appointment: {
  customer_name: string
  customer_email: string
  service: string
  date: string
  time: string
}) {
  if (!appointment.customer_email) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.customer_email,
      subject: `Appointment Confirmed — Ghost LA Blendz`,
      html: emailWrapper(`
        <h1 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px;">You're confirmed.</h1>
        <p style="font-size:14px;color:#78716C;margin:0 0 24px;">See you then. Please arrive a few minutes early.</p>
        ${appointmentBlock(appointment)}
        <div style="margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;">
          <p style="margin:0;font-size:13px;color:#166534;">✓ Appointment confirmed</p>
        </div>
      `),
    })
  } catch (err) {
    console.error('Failed to send approval notification:', err)
  }
}

export async function sendDeclineNotification(appointment: {
  customer_name: string
  customer_email: string
  service: string
  date: string
  time: string
}) {
  if (!appointment.customer_email) return
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.customer_email,
      subject: `Booking Update — Ghost LA Blendz`,
      html: emailWrapper(`
        <h1 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px;">Booking Unavailable</h1>
        <p style="font-size:14px;color:#78716C;margin:0 0 24px;">Unfortunately that slot isn't available. Please book a different time.</p>
        ${appointmentBlock(appointment)}
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostlablendz.com'}/book" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.05em;border-radius:2px;">Book Again</a>
      `),
    })
  } catch (err) {
    console.error('Failed to send decline notification:', err)
  }
}
