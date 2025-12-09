import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Libera rotas públicas e internas (você já tinha, só organizei melhor)
  const publicPaths = [
    '/_next',
    '/api',
    '/static',
    '/favicon.ico',
    '/login',                    // permite acessar a página de login
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 2. Verifica se está logado (você usa cookie 'auth' = 'true')
  const isLoggedIn = req.cookies.get('auth')?.value === 'true';

  // 3. Se já está logado e está tentando ir pro /login → joga pro menu
  if (isLoggedIn && pathname === '/login') {
    const menuUrl = new URL('/menu', req.url);   // muda pra /dashboard se preferir
    return NextResponse.redirect(menuUrl);
  }

  // 4. Se NÃO está logado → manda pro login (com ?from= pra voltar depois)
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Qualquer outro caso (logado e acessando rota protegida) → deixa passar
  return NextResponse.next();
}

// Aplicar em todas as rotas exceto as públicas
export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico|login).*)'],
};