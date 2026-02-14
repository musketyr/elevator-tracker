import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.url
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', baseUrl))
  }

  try {
    const result = await pool.query(
      `SELECT ml.id, ml.admin_id, a.email FROM magic_links ml JOIN admins a ON a.id = ml.admin_id WHERE ml.token = $1 AND ml.expires_at > NOW() AND ml.used_at IS NULL`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL('/admin/login?error=expired', baseUrl))
    }

    const { admin_id, email } = result.rows[0]

    // Mark as used
    await pool.query('UPDATE magic_links SET used_at = NOW() WHERE token = $1', [token])

    // Create JWT
    const jwt = signToken({ id: admin_id, email })

    const response = NextResponse.redirect(new URL('/admin', baseUrl))
    response.cookies.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=server', baseUrl))
  }
}
