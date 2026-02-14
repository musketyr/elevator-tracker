import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    `SELECT e.*, (SELECT COUNT(*) FROM reports r WHERE r.elevator_id = e.id) as report_count
     FROM elevators e
     WHERE e.admin_id = $1
        OR EXISTS (SELECT 1 FROM elevator_admins ea WHERE ea.elevator_id = e.id AND ea.admin_id = $1)
     ORDER BY e.created_at DESC`,
    [admin.id]
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, location, languages } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const langs = Array.isArray(languages) && languages.length > 0 ? languages : ['en']

  const result = await pool.query(
    'INSERT INTO elevators (name, location, admin_id, languages) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, location || null, admin.id, langs]
  )

  // Also add to elevator_admins junction table
  await pool.query(
    'INSERT INTO elevator_admins (admin_id, elevator_id, role) VALUES ($1, $2, $3) ON CONFLICT (admin_id, elevator_id) DO NOTHING',
    [admin.id, result.rows[0].id, 'owner']
  )

  return NextResponse.json(result.rows[0])
}
