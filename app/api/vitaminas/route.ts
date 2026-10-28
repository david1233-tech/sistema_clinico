import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM recetas ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al listar vitaminas:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los tratamientos.' }, { status: 503 });
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
  const nombre = String(body.nombre_paciente ?? '').trim();
  const vitamina = String(body.vitaminaNombre ?? '').trim();
  if (!/^\d{8}$/.test(dni) || !nombre || !vitamina) {
    return NextResponse.json({ error: 'Complete paciente y tratamiento.' }, { status: 400 });
  }
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO recetas (dni_paciente, nombre_paciente, vitaminaNombre, dosis, via, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
      [dni, nombre, vitamina, String(body.dosis ?? ''), String(body.via ?? ''), String(body.observaciones ?? '')]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar vitamina:', error);
    return NextResponse.json({ error: 'No se pudo guardar el tratamiento.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  if (!dni) return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
  try {
    await pool.execute<ResultSetHeader>('UPDATE recetas SET activo = 0 WHERE dni_paciente = ?', [dni]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al desmarcar tratamiento:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el tratamiento.' }, { status: 503 });
  }
}

