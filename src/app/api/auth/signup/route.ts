import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Create or find admin
    let admin = await pool.query('SELECT id, email FROM admins WHERE email = $1', [email.toLowerCase()])
    if (admin.rows.length === 0) {
      admin = await pool.query('INSERT INTO admins (email) VALUES ($1) RETURNING id, email', [email.toLowerCase()])
    }

    const adminId = admin.rows[0].id
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await pool.query(
      'INSERT INTO magic_links (admin_id, token, expires_at) VALUES ($1, $2, $3)',
      [adminId, token, expiresAt]
    )

    // Send email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicUrl = `${appUrl}/api/auth/verify?token=${token}`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Elevator Tracker <noreply@telegraphic.app>',
        to: email.toLowerCase(),
        subject: 'Your login link — Elevator Tracker',
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px 32px 28px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🛗</div>
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;">Elevator Tracker</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Here's your login link. Click the button below to access your dashboard.
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${magicUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
          Log In to Dashboard
        </a>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 16px;">This link expires in 15 minutes.</p>
      <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="color:#94a3b8;font-size:11px;margin:0 0 4px;">If the button doesn't work, copy this link:</p>
        <p style="color:#64748b;font-size:11px;word-break:break-all;margin:0;">${magicUrl}</p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">Elevator Tracker · Smart elevator monitoring</p>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
