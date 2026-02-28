import { NextRequest, NextResponse } from 'next/server'

// Middleware is disabled - using client-side auth checks via AuthContext instead
// The AuthContext handles redirects for protected routes (dashboard, profile)

export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
