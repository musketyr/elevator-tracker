import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, elevatorId } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (!elevatorId) {
    return NextResponse.json({ error: 'Elevator is required' }, { status: 400 })
  }

  // Verify the inviter has access to this elevator
  const elevatorCheck = await pool.query(
    `SELECT id, name, location FROM elevators WHERE id = $1
     AND (admin_id = $2 OR EXISTS (SELECT 1 FROM elevator_admins ea WHERE ea.elevator_id = $1 AND ea.admin_id = $2))`,
    [elevatorId, admin.id]
  )
  if (elevatorCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Elevator not found' }, { status: 404 })
  }
  const elevator = elevatorCheck.rows[0]

  // Create new admin
  let newAdmin = await pool.query('SELECT id FROM admins WHERE email = $1', [email.toLowerCase()])
  if (newAdmin.rows.length === 0) {
    newAdmin = await pool.query(
      'INSERT INTO admins (email, invited_by) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase(), admin.id]
    )
  }

  const adminId = newAdmin.rows[0].id
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await pool.query(
    'INSERT INTO magic_links (admin_id, token, expires_at, elevator_id) VALUES ($1, $2, $3, $4)',
    [adminId, token, expiresAt, elevatorId]
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicUrl = `${appUrl}/api/auth/verify?token=${token}`

  const elevatorName = elevator.name
  const elevatorLocation = elevator.location ? ` (${elevator.location})` : ''

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Elevator Tracker <noreply@telegraphic.app>',
      to: email.toLowerCase(),
      subject: `You're invited to manage "${elevatorName}" on Elevator Tracker`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px 32px 28px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🛗</div>
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Elevator Tracker</h1>
      <p style="color:#bfdbfe;font-size:13px;margin:4px 0 0;">Smart elevator issue monitoring</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi there! <strong>${admin.email}</strong> has invited you to help manage an elevator on Elevator Tracker.
      </p>

      <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 20px;">
        Elevator Tracker lets building managers monitor elevator issues in real-time through simple QR code reports from residents. No app downloads needed.
      </p>

      <!-- Elevator info -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;font-weight:600;">You're being invited to manage</p>
        <p style="color:#1e293b;font-size:18px;font-weight:700;margin:0;">${elevatorName}${elevatorLocation}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${magicUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
          Accept Invitation & Log In
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 16px;">
        This link expires in 24 hours.
      </p>

      <!-- Fallback link -->
      <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;">If the button doesn't work, copy this link:</p>
        <p style="color:#64748b;font-size:11px;word-break:break-all;margin:0;">${magicUrl}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">Elevator Tracker · Smart elevator monitoring</p>
    </div>
  </div>
</body>
</html>`,
    }),
  })

  return NextResponse.json({ ok: true })
}
