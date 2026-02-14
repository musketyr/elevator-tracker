import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = req.nextUrl.searchParams.get('days') === '30' ? 30 : 7

  // Reports over time
  const timeline = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*) as count 
     FROM reports WHERE elevator_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at) ORDER BY date`,
    [params.id]
  )

  // Breakdown by issue type
  const breakdown = await pool.query(
    `SELECT issue_type, COUNT(*) as count 
     FROM reports WHERE elevator_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY issue_type`,
    [params.id]
  )

  // Total
  const total = await pool.query(
    'SELECT COUNT(*) as count FROM reports WHERE elevator_id = $1',
    [params.id]
  )

  return NextResponse.json({
    timeline: timeline.rows,
    breakdown: breakdown.rows,
    total: parseInt(total.rows[0].count),
  })
}
