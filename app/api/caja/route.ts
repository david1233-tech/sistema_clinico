import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const databaseError = (error: unknown) => {
  console.error('Error en /api/caja:', error);
  return NextResponse.json({ error: 'No se pudo acceder a la base de datos. Intente de nuevo.' }, { status: 503 });
};

export async function GET() {
  try {
    const [pagos] = await pool.query<RowDataPacket[]>('SELECT * FROM pagos ORDER BY id DESC');
    const [totales] = await pool.query<RowDataPacket[]>('SELECT COALESCE(SUM(monto), 0) AS total_general FROM pagos');
    return NextResponse.json({ pagos, totales: totales[0] });
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
  const nombre = String(body.nombre_paciente ?? '').trim();
  const monto = Number(body.monto);
  if (!/^\d{8}$/.test(dni) || !nombre || !Number.isFinite(monto) || monto <= 0) {
    return NextResponse.json({ error: 'Revise DNI, nombre y monto.' }, { status: 400 });
  }
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pagos (dni_paciente, nombre_paciente, concepto, monto, tipo_ingreso, destinatario_pago, metodo_pago, paciente_id, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT id FROM pacientes WHERE dni = ? LIMIT 1), NULL)`,
      [dni, nombre, String(body.concepto ?? '').trim() || 'Consulta / Tratamiento', monto,
        String(body.destino_pago ?? body.tipo_ingreso ?? 'Caja'),
        String(body.destino_pago ?? 'Caja').toLowerCase() === 'doctora' ? 'doctora' : 'caja',
        String(body.metodo_pago ?? 'Efectivo'), dni]
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
    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM pagos WHERE id = ?', [id]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError(error);
  }
}

