import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createSession, SESSION_COOKIE, type Role } from '@/lib/auth';

const accounts: { username: string; role: Role; name: string; env: string; next: string }[] = [
  { username: 'SusanaVital', role: 'doctora', name: 'Dra. Susana', env: 'DOCTORA_PASSWORD', next: '/dashboard' },
  { username: 'PilarVITAL', role: 'enfermera', name: 'Enf. Pilar', env: 'ENFERMERA_PASSWORD', next: '/enfermeria' },
  { username: 'GabyVITAL', role: 'recepcion', name: 'Recep. Gaby', env: 'RECEPCION_PASSWORD', next: '/agenda' },
];

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!process.env.AUTH_SECRET || accounts.some(account => !process.env[account.env])) {
    return NextResponse.json({ error: 'El acceso aún no está configurado en el servidor.' }, { status: 503 });
  }
  let body: { usuario?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  const account = accounts.find(item => item.username === body.usuario);
  if (!account || typeof body.password !== 'string' || !equal(body.password, process.env[account.env] || '')) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, role: account.role, name: account.name, next: account.next });
  response.cookies.set(SESSION_COOKIE, createSession(account.role, process.env.AUTH_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

