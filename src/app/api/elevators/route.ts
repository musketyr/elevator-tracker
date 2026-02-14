import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    'SELECT e.*, (SELECT COUNT(*) FROM reports r WHERE r.elevator_id = e.id) as report_count FROM elevators e ORDER BY e.created_at DESC'
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, location } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const result = await pool.query(
    'INSERT INTO elevators (name, location, admin_id) VALUES ($1, $2, $3) RETURNING *',
    [name, location || null, admin.id]
  )
  return NextResponse.json(result.rows[0])
}
