import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const { pathname } = req.nextUrl

  // Ruhusu Chrome pekee
  if (!ua.includes('Chrome')) {
    const url = req.nextUrl.clone()
    url.pathname = '/blocked'
    return NextResponse.redirect(url)
  }

  // Zuia kufungua /login moja kwa moja
  if (pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/'   // ukurasa wa nyumbani
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
