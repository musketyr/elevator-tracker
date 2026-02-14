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
        languages TEXT[] DEFAULT '{en}',
        created_at TIMESTAMP DEFAULT now()
      )
    `)
    // Add languages column if it doesn't exist (for existing installations)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE elevators ADD COLUMN languages TEXT[] DEFAULT '{en}';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$
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
    await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255)`)
    await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS suspicious BOOLEAN DEFAULT false`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_elevator ON reports(elevator_id)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reports_elevator_device ON reports(elevator_id, device_hash, created_at)`)

    // Elevator admins junction table (admin scoping per elevator)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS elevator_admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
        elevator_id UUID REFERENCES elevators(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT now(),
        UNIQUE(admin_id, elevator_id)
      )
    `)

    // Add elevator_id to magic_links for scoped invitations
    await pool.query(`ALTER TABLE magic_links ADD COLUMN IF NOT EXISTS elevator_id UUID REFERENCES elevators(id) ON DELETE SET NULL`)

    // Migrate existing data: if elevators have admin_id, create elevator_admins entries
    await pool.query(`
      INSERT INTO elevator_admins (admin_id, elevator_id, role)
      SELECT admin_id, id, 'owner' FROM elevators WHERE admin_id IS NOT NULL
      ON CONFLICT (admin_id, elevator_id) DO NOTHING
    `)

    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
