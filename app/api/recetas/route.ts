import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { pgPool, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  try {
    const columnas = await pgPool.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'recetas'
    `);
    const nombres = new Set(columnas.rows.map((columna: { column_name: string }) => columna.column_name));
    const nombreVitamina = ['vitaminaNombre', 'vitaminanombre', 'vitamina_nombre', 'nombre_vitamina', 'medicamento'].find(nombre => nombres.has(nombre));
    const nombreFecha = ['fechaAplicacion', 'fechaaplicacion', 'fecha_aplicacion'].find(nombre => nombres.has(nombre));
    if (!nombreVitamina || !nombreFecha) throw new Error('Faltan columnas del historial de vitaminas');
    const vitamina = `"${nombreVitamina.replaceAll('"', '""')}"`;
    const fecha = `"${nombreFecha.replaceAll('"', '""')}"`;
    const [rows] = await pool.query<RowDataPacket[]>(
      dni ? `SELECT *, ${vitamina} AS medicamento, ${fecha} AS "fechaAplicacion" FROM recetas WHERE dni_paciente = ? ORDER BY id DESC`
          : `SELECT *, ${vitamina} AS medicamento, ${fecha} AS "fechaAplicacion" FROM recetas ORDER BY id DESC`,
      dni ? [dni] : []
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al listar tratamientos:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los tratamientos.' }, { status: 503 });
  }
}
