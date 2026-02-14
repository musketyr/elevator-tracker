import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

const VALID_ISSUES = ['stopped_unexpectedly', 'rumbled_occupied', 'rumbled_arrival']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { elevator_id, issue_type, device_hash, honeypot } = body

    // Honeypot check
    if (honeypot) {
      return NextResponse.json({ ok: true }) // Silently ignore bots
    }

    if (!elevator_id || !issue_type || !VALID_ISSUES.includes(issue_type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Check elevator exists
    const elevator = await pool.query('SELECT id FROM elevators WHERE id = $1', [elevator_id])
    if (elevator.rows.length === 0) {
      return NextResponse.json({ error: 'Elevator not found' }, { status: 404 })
    }

    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown'

    // Rate limit: 1 report per device per hour
    if (device_hash) {
      const recent = await pool.query(
        `SELECT id FROM reports WHERE elevator_id = $1 AND device_hash = $2 AND created_at > NOW() - INTERVAL '1 hour'`,
        [elevator_id, device_hash]
      )
      if (recent.rows.length > 0) {
        return NextResponse.json({ error: 'Too many reports', cooldown: true }, { status: 429 })
      }
    }

    // IP rate limit: 5 reports per IP per hour across all elevators
    const ipRecent = await pool.query(
      `SELECT COUNT(*) as cnt FROM reports WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [ip]
    )
    if (parseInt(ipRecent.rows[0].cnt) >= 5) {
      return NextResponse.json({ error: 'Too many reports', cooldown: true }, { status: 429 })
    }

    await pool.query(
      'INSERT INTO reports (elevator_id, issue_type, device_hash, ip_address) VALUES ($1, $2, $3, $4)',
      [elevator_id, issue_type, device_hash || null, ip]
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
