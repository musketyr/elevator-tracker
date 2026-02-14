import { Metadata } from 'next'
import pool from '@/lib/db'
import ReportClient from './ReportClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: 'Report Elevator Issue' }
}

export default async function ElevatorPage({ params }: { params: { id: string } }) {
  let elevator = null
  try {
    const result = await pool.query('SELECT id, name, location FROM elevators WHERE id = $1', [params.id])
    if (result.rows.length > 0) elevator = result.rows[0]
  } catch {}

  if (!elevator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl text-gray-600">Elevator not found</p>
        </div>
      </div>
    )
  }

  return <ReportClient elevator={elevator} />
}
