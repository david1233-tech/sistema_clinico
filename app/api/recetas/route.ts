import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      dni ? 'SELECT *, "vitaminaNombre" AS medicamento FROM recetas WHERE dni_paciente = ? ORDER BY id DESC'
          : 'SELECT *, "vitaminaNombre" AS medicamento FROM recetas ORDER BY id DESC',
      dni ? [dni] : []
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al listar tratamientos:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los tratamientos.' }, { status: 503 });
  }
}

