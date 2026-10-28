import { createHmac, timingSafeEqual } from 'node:crypto';

export type Role = 'doctora' | 'enfermera' | 'recepcion';
export const SESSION_COOKIE = 'vital_session';

type Session = { role: Role; expires: number };

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSession(role: Role, secret: string) {
  const payload = Buffer.from(JSON.stringify({ role, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload, secret)}`;
}

export function readSession(token: string | undefined, secret: string | undefined): Session | null {
  if (!token || !secret) return null;
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    if (!['doctora', 'enfermera', 'recepcion'].includes(session.role) || !Number.isFinite(session.expires) || session.expires < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function allows(role: Role, pathname: string, method: string) {
  if (role === 'doctora') return true;
  const isGet = method === 'GET' || method === 'HEAD';
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/logout') return true;
    if (pathname.startsWith('/api/pacientes')) return true;
    if (pathname.startsWith('/api/reniec')) return true;
    if (pathname.startsWith('/api/recetas')) return isGet;
    if (pathname.startsWith('/api/triaje')) return role === 'enfermera' || isGet;
    if (pathname.startsWith('/api/consulta')) return role === 'recepcion' && isGet;
    if (pathname.startsWith('/api/internados') || pathname.startsWith('/api/vitaminas')) return role === 'enfermera';
    if (pathname.startsWith('/api/caja') || pathname.startsWith('/api/citas')) return role === 'recepcion';
    return false;
  }
  if (pathname.startsWith('/recepcion')) return true;
  if (['/enfermeria', '/triaje', '/vitaminas', '/internados'].some(path => pathname.startsWith(path))) return role === 'enfermera';
  if (['/agenda', '/caja'].some(path => pathname.startsWith(path))) return role === 'recepcion';
  return false;
}

