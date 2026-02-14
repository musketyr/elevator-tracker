import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        invited_by UUID REFERENCES admins(id),
        created_at TIMESTAMP DEFAULT now()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS magic_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        token VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS elevators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        location VARCHAR(500),
        admin_id UUID REFERENCES admins(id),
        created_at TIMESTAMP DEFAULT now()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        elevator_id UUID REFERENCES elevators(id) ON DELETE CASCADE,
        issue_type VARCHAR(50) NOT NULL,
        device_hash VARCHAR(64),
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT now()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_elevator ON reports(elevator_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_elevator_device ON reports(elevator_id, device_hash, created_at)`)

    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
