import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public and internal paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('auth')?.value;
  if (auth === 'true') {
    return NextResponse.next();
  }

  // redirect to login and preserve original path in `from` query
  // use req.nextUrl.clone() so the origin (host:port) is preserved
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

// Apply middleware to all routes except _next, api and login
export const config = {
  matcher: [
    '/((?!_next|api|login|static|favicon.ico).*)',
  ],
};
