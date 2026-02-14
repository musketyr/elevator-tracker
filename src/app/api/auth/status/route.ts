import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth'

export async function GET() {
  const admin = await getAdmin()
  if (admin) {
    return NextResponse.json({ loggedIn: true, email: admin.email })
  }
  return NextResponse.json({ loggedIn: false })
}
