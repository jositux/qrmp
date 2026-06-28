import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Primero refrescar la sesión (cookies actualizadas)
  const response = await updateSession(request)

  const { pathname } = request.nextUrl

  // Rutas públicas — no requieren sesión
  const isPublic =
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  if (isPublic) return response

  // Verificar sesión con los cookies ya refrescados
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Sin sesión → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en login/registro → panel
  if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/registro') {
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
