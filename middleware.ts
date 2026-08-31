import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = req.cookies.get('auth')?.value === 'true';

  // /login precisa passar pelo middleware: quem já está autenticado não deve
  // voltar para a tela de login.
  if (pathname === '/login') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Libera somente recursos internos e APIs.
  const publicPaths = [
    '/_next',
    '/api',
    '/static',
    '/favicon.ico',
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Se NÃO está logado → manda pro login (com ?from= pra voltar depois).
  if (!isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário logado acessando rota protegida.
  return NextResponse.next();
}

// /login fica no matcher para redirecionar usuários já autenticados.
export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};
