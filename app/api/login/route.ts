import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createSession, readSession, SESSION_COOKIE, type Role } from '@/lib/auth';

const accounts: { username: string; role: Role; name: string; env: string; next: string }[] = [
  { username: 'SusanaVital', role: 'doctora', name: 'Dra. Susana', env: 'DOCTORA_PASSWORD', next: '/dashboard' },
  { username: 'PilarVital', role: 'enfermera', name: 'Enf. Pilar', env: 'ENFERMERA_PASSWORD', next: '/enfermeria' },
  { username: 'GabyVital', role: 'recepcion', name: 'Recep. Gaby', env: 'RECEPCION_PASSWORD', next: '/agenda' },
  { username: 'Warcry86', role: 'operador', name: 'Warcry86', env: 'WARCRY_PASSWORD', next: '/recepcion' },
];

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)vital_session=([^;]+)/)?.[1];
  const session = readSession(cookie, process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ authenticated: false });
  const account = accounts.find(item => item.role === session.role);
  return NextResponse.json({ authenticated: true, role: session.role, name: account?.name, next: account?.next || '/dashboard' });
}

export async function POST(request: Request) {
  if (!process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'El acceso aún no está configurado en el servidor.' }, { status: 503 });
  }
  let body: { usuario?: unknown; password?: unknown; mobile?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  const username = typeof body.usuario === 'string' ? body.usuario.trim().toLowerCase() : '';
  const account = accounts.find(item => item.username.toLowerCase() === username);
  const configuredPassword = account ? process.env[account.env] : undefined;
  if (!account || typeof body.password !== 'string' || !configuredPassword || !equal(body.password, configuredPassword)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, role: account.role, name: account.name, next: account.next });
  const days = body.mobile === true ? 90 : 7;
  response.cookies.set(SESSION_COOKIE, createSession(account.role, process.env.AUTH_SECRET, days), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
  return response;
}
