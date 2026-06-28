import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  if (isPublic) return response

  // Sin sesión → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en / → panel
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/panel'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
