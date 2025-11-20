import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const { pathname } = req.nextUrl
  const visitedHome = req.cookies.get('visitedHome')

  // Ruhusu Chrome pekee
  if (!ua.includes('Chrome')) {
    const url = req.nextUrl.clone()
    url.pathname = '/blocked'
    return NextResponse.redirect(url)
  }

  // Ikiwa sio homepage na cookie haipo → redirect Failed
  if (pathname !== '/' && !visitedHome) {
    const url = req.nextUrl.clone()
    url.pathname = '/failed'
    return NextResponse.redirect(url)
  }

  // Zuia kufungua /login moja kwa moja bila cookie
  if (pathname === '/login' && !visitedHome) {
    const url = req.nextUrl.clone()
    url.pathname = '/failed'
    return NextResponse.redirect(url)
  }

  // Ikiwa ni homepage, weka cookie visitedHome yenye expiry ya dakika 30
  if (pathname === '/') {
    const res = NextResponse.next()
    res.cookies.set('visitedHome', 'true', {
      maxAge: 60 * 30, // 30 minutes
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })
    return res
  }

  // Ikiwa ni logout, futa cookie visitedHome
  if (pathname === '/logout') {
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.delete('visitedHome')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
