import { NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  if (body.estado !== 'alta') return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE internamientos SET estado = 'alta', fecha_salida = ?, hora_salida = ?, motivo_salida = ?, notas_salida = ? WHERE id = ?`,
      [String(body.fecha_salida ?? '').trim() || null, String(body.hora_salida ?? '').trim() || null,
        String(body.motivo_salida ?? ''), String(body.notas_salida ?? ''), id]
    );
    if (!result.affectedRows) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al registrar alta:', error);
    return NextResponse.json({ error: 'No se pudo registrar el alta.' }, { status: 503 });
  }
}

