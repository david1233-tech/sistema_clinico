import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const databaseError = (error: unknown) => {
  console.error('Error en /api/consulta:', error);
  return NextResponse.json({ error: 'No se pudo acceder a la base de datos. Intente de nuevo.' }, { status: 503 });
};

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  if (!dni) return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM consultas WHERE dni_paciente = ? ORDER BY id DESC', [dni]
    );
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
  const dni = String(body.dni_paciente ?? '').trim();
  if (!/^\d{8}$/.test(dni)) return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO consultas (dni_paciente, fecha, motivo, diagnostico, receta, dieta, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dni, new Date().toISOString().slice(0, 19).replace('T', ' '), String(body.motivo ?? ''), String(body.diagnostico ?? ''), String(body.receta ?? ''), String(body.dieta ?? ''), body.imagen_url ? String(body.imagen_url) : null]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM consultas WHERE id = ?', [id]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError(error);
  }
}

