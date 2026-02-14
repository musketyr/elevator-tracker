import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { reporter_name } = body

    if (!reporter_name || typeof reporter_name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    const result = await pool.query(
      'UPDATE reports SET reporter_name = $1 WHERE id = $2 RETURNING id',
      [reporter_name.trim().substring(0, 255), id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Report update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
