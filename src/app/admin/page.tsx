import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')

  return (
    <Suspense>
      <AdminDashboard admin={admin} />
    </Suspense>
  )
}
