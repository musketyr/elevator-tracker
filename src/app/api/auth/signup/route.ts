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
        from: 'Elevator Tracker <onboarding@resend.dev>',
        to: email.toLowerCase(),
        subject: 'Your login link - Elevator Tracker',
        html: `<p>Click the link below to log in:</p><p><a href="${magicUrl}">${magicUrl}</a></p><p>This link expires in 15 minutes.</p>`,
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
