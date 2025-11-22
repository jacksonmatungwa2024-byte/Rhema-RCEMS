import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const { pathname } = req.nextUrl
  const visitedHome = req.cookies.get('visitedHome')

  // ⚠️ Skip checks for special routes ili kuepuka loop
  if (pathname.startsWith('/blocked') || pathname.startsWith('/failed')) {
    return NextResponse.next()
  }

  // ✅ Ruhusu Google Chrome pekee (strict check)
  const isChrome =
    /\bChrome\/\d+/.test(ua) &&
    ua.includes('Safari/537.36') &&
    !ua.includes('Edg') &&
    !ua.includes('OPR') &&
    !ua.includes('Brave') &&
    !ua.includes('Vivaldi') &&
    !ua.includes('SamsungBrowser') &&
    !ua.includes('Phoenix') &&
    !ua.includes('CriOS') &&
    !ua.includes('Electron') &&
    !ua.includes('Chromium')

  if (!isChrome) {
    const url = req.nextUrl.clone()
    url.pathname = '/blocked'
    return NextResponse.redirect(url)
  }

  // 🏠 Ikiwa ni homepage, weka cookie visitedHome yenye expiry ya dakika 30
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

  // 🔒 Ikiwa sio homepage na cookie haipo → redirect Failed
  if (!visitedHome) {
    const url = req.nextUrl.clone()
    url.pathname = '/failed'
    return NextResponse.redirect(url)
  }

  // 🚪 Ikiwa ni logout, futa cookie visitedHome na rudisha nyumbani
  if (pathname === '/logout') {
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.delete('visitedHome')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
}
