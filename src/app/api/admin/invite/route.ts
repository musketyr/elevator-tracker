import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

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
    'INSERT INTO magic_links (admin_id, token, expires_at) VALUES ($1, $2, $3)',
    [adminId, token, expiresAt]
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicUrl = `${appUrl}/api/auth/verify?token=${token}`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Elevator Tracker <noreply@telegraphic.app>',
      to: email.toLowerCase(),
      subject: "You've been invited to Elevator Tracker",
      html: `<p>${admin.email} has invited you to manage elevators.</p><p><a href="${magicUrl}">Click here to accept</a></p><p>This link expires in 24 hours.</p>`,
    }),
  })

  return NextResponse.json({ ok: true })
}
