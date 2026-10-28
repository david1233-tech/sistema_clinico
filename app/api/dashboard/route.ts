import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Total = RowDataPacket & { total: number };
type Sales = RowDataPacket & { total: number; transacciones: number; caja: number; doctora: number };
type Month = RowDataPacket & { mes: string; total: number };

export async function GET() {
  try {
    const [pacientes] = await pool.query<Total[]>('SELECT COUNT(*) AS total FROM pacientes');
    const [triajes] = await pool.query<Total[]>("SELECT COUNT(*) AS total FROM triaje WHERE (fecha AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date");
    const [ingresos] = await pool.query<Total[]>("SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE (fecha AT TIME ZONE 'America/Lima')::date = (NOW() AT TIME ZONE 'America/Lima')::date");
    const [ventas] = await pool.query<Sales[]>(
      `SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS transacciones,
       COALESCE(SUM(CASE WHEN LOWER(tipo_ingreso) = 'doctora' THEN 0 ELSE monto END), 0) AS caja,
       COALESCE(SUM(CASE WHEN LOWER(tipo_ingreso) = 'doctora' THEN monto ELSE 0 END), 0) AS doctora
       FROM pagos WHERE DATE_TRUNC('month', fecha AT TIME ZONE 'America/Lima') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Lima')`
    );
    const [vitaminas] = await pool.query<Total[]>('SELECT COUNT(*) AS total FROM recetas');
    const [internados] = await pool.query<Total[]>('SELECT COUNT(*) AS total FROM internamientos');
    const [listadoVitaminas] = await pool.query<RowDataPacket[]>('SELECT * FROM recetas ORDER BY id DESC LIMIT 10');
    const [listadoInternados] = await pool.query<RowDataPacket[]>('SELECT * FROM internamientos ORDER BY id DESC LIMIT 10');
    const [ultimosTriajes] = await pool.query<RowDataPacket[]>('SELECT * FROM triaje ORDER BY id DESC LIMIT 5');
    const [ultimosPagos] = await pool.query<RowDataPacket[]>('SELECT * FROM pagos ORDER BY id DESC LIMIT 5');
    const [meses] = await pool.query<Month[]>(
      `SELECT TO_CHAR(fecha AT TIME ZONE 'America/Lima', 'YYYY-MM') AS mes, COALESCE(SUM(monto), 0) AS total
       FROM pagos WHERE fecha >= NOW() - INTERVAL '3 months'
       GROUP BY TO_CHAR(fecha AT TIME ZONE 'America/Lima', 'YYYY-MM') ORDER BY mes`
    );
    return NextResponse.json({
      metrics: {
        totalPacientes: Number(pacientes[0].total),
        triajesHoy: Number(triajes[0].total),
        ingresosHoy: Number(ingresos[0].total),
      },
      octubreReport: {
        totalVendido: Number(ventas[0].total),
        transacciones: Number(ventas[0].transacciones),
        caja: Number(ventas[0].caja),
        doctora: Number(ventas[0].doctora),
        totalVitaminas: Number(vitaminas[0].total),
        totalInternados: Number(internados[0].total),
      },
      reporteMensual: meses.map(item => ({ mes: item.mes, total: Number(item.total) })),
      listadoVitaminas,
      listadoInternados,
      ultimosTriajes,
      ultimosPagos,
    });
  } catch (error) {
    console.error('Error cargando API dashboard:', error);
    return NextResponse.json({ error: 'No se pudo cargar el dashboard.' }, { status: 503 });
  }
}

