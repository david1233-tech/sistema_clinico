import { NextResponse, type NextRequest } from 'next/server';
import { allows, readSession, SESSION_COOKIE } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/api/login') return NextResponse.next();
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET);
  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Inicie sesión para continuar.' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!allows(session.role, pathname, request.method)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'No tiene permiso para esta operación.' }, { status: 403 });
    return NextResponse.redirect(new URL(session.role === 'doctora' ? '/dashboard' : session.role === 'enfermera' ? '/enfermeria' : '/agenda', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*', '/dashboard/:path*', '/admin/:path*', '/recepcion/:path*',
    '/enfermeria/:path*', '/triaje/:path*', '/consultorio/:path*',
    '/agenda/:path*', '/vitaminas/:path*', '/internados/:path*', '/caja/:path*',
    '/medico/:path*', '/hospitalizacion/:path*',
  ],
};

