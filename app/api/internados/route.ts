import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT *, TO_CHAR(fecha_ingreso, 'YYYY-MM-DD') AS fecha_ingreso, TO_CHAR(fecha_estimada_salida, 'YYYY-MM-DD') AS fecha_estimada_salida, TO_CHAR(fecha_salida, 'YYYY-MM-DD') AS fecha_salida, TO_CHAR(hora_salida, 'HH24:MI') AS hora_salida FROM internamientos ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al listar internamientos:', error);
    return NextResponse.json({ error: 'No se pudo cargar internamientos.' }, { status: 503 });
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
  const cama = String(body.cama ?? '').trim();
  if (!/^\d{8}$/.test(dni) || !nombre || !cama) {
    return NextResponse.json({ error: 'Complete DNI, nombre y cama.' }, { status: 400 });
  }
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO internamientos
       (dni_paciente, nombre_paciente, cama, fecha_ingreso, tiempo_estancia_num, tiempo_estancia_unidad,
        fecha_estimada_salida, diagnostico, observaciones, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'hospitalizado')`,
      [dni, nombre, cama, String(body.fecha_ingreso ?? '').trim() || new Date().toISOString().slice(0, 10),
        Number(body.tiempo_estancia_num) || 1, String(body.tiempo_estancia_unidad ?? 'dias'),
        String(body.fecha_estimada_salida ?? '').trim() || null, String(body.diagnostico ?? ''), String(body.observaciones ?? '')]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar internamiento:', error);
    return NextResponse.json({ error: 'No se pudo guardar el internamiento.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM internamientos WHERE id = ?', [id]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar internamiento:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el internamiento.' }, { status: 503 });
  }
}

