import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getAdmin } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${appUrl}/e/${params.id}`

  const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 })

  return NextResponse.json({ qr: qrDataUrl, url })
}
