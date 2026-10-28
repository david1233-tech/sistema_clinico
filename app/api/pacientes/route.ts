import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const databaseError = (error: unknown) => {
  console.error('Error en /api/pacientes:', error);
  return NextResponse.json({ error: 'No se pudo acceder a la base de datos. Intente de nuevo.' }, { status: 503 });
};

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  try {
    if (dni) {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pacientes WHERE dni = ? LIMIT 1', [dni]);
      return rows.length ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pacientes ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  const dni = String(body.dni ?? '').trim();
  const nombre = String(body.nombre ?? '').trim();
  if (!/^\d{8}$/.test(dni) || !nombre) {
    return NextResponse.json({ error: 'Ingrese un DNI de 8 dígitos y el nombre completo.' }, { status: 400 });
  }
  try {
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM pacientes WHERE dni = ? LIMIT 1', [dni]);
    if (existing.length) return NextResponse.json({ error: 'El DNI ya está registrado.' }, { status: 409 });
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO pacientes (dni, nombre, telefono, edad, genero, direccion) VALUES (?, ?, ?, ?, ?, ?)',
      [dni, nombre, String(body.telefono ?? '').trim() || null, body.edad ? Number(body.edad) : null, String(body.genero ?? '').trim() || null, String(body.direccion ?? '').trim() || null]
    );
    return NextResponse.json({ id: result.insertId, dni, nombre }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'El DNI ya está registrado.' }, { status: 409 });
    }
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const dni = searchParams.get('dni');
  if (!id && !dni) return NextResponse.json({ error: 'Se requiere ID o DNI' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      id ? 'DELETE FROM pacientes WHERE id = ?' : 'DELETE FROM pacientes WHERE dni = ?',
      [id || dni]
    );
    if (!result.affectedRows) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError(error);
  }
}

