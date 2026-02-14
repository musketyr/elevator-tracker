import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { suspicious } = body

    const result = await pool.query(
      'UPDATE reports SET suspicious = $1 WHERE id = $2 RETURNING id',
      [!!suspicious, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Suspicious toggle error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
