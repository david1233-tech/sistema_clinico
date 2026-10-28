import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, COALESCE(c.dni_paciente, p.dni) AS dni_paciente,
       COALESCE(c.nombre_paciente, p.nombre) AS nombre_paciente,
       COALESCE(c.telefono, p.telefono) AS telefono,
       TO_CHAR(COALESCE(c.fecha, c.fecha_hora_cita::date), 'YYYY-MM-DD') AS fecha,
       TO_CHAR(COALESCE(c.hora, c.fecha_hora_cita::time), 'HH24:MI') AS hora,
       c.motivo, CASE WHEN c.estado = 'programada' THEN 'pendiente' ELSE c.estado END AS estado
       FROM citas c LEFT JOIN pacientes p ON p.id = c.paciente_id
       ORDER BY COALESCE(c.fecha, c.fecha_hora_cita::date) DESC, c.id DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al listar citas:', error);
    return NextResponse.json({ error: 'No se pudo cargar la agenda.' }, { status: 503 });
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
  const fecha = String(body.fecha ?? '').trim();
  const hora = String(body.hora ?? '').trim();
  if (!/^\d{8}$/.test(dni) || !nombre || !fecha || !hora) {
    return NextResponse.json({ error: 'Complete DNI, nombre, fecha y hora.' }, { status: 400 });
  }
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO citas (dni_paciente, nombre_paciente, telefono, fecha, hora, fecha_hora_cita, motivo, estado, paciente_id, doctor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'programada', (SELECT id FROM pacientes WHERE dni = ? LIMIT 1), NULL)`,
      [dni, nombre, String(body.telefono ?? ''), fecha, hora, `${fecha} ${hora}:00`, String(body.motivo ?? ''), dni]
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar cita:', error);
    return NextResponse.json({ error: 'No se pudo guardar la cita.' }, { status: 503 });
  }
}

