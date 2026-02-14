import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, location, languages } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const langs = Array.isArray(languages) && languages.length > 0 ? languages : ['en']

  const result = await pool.query(
    'UPDATE elevators SET name = $1, location = $2, languages = $3 WHERE id = $4 RETURNING *',
    [name, location || null, langs, params.id]
  )
  if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await pool.query('DELETE FROM elevators WHERE id = $1', [params.id])
  return NextResponse.json({ ok: true })
}
