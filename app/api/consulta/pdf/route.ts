import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { crearPdfConsulta } from '@/lib/consulta-pdf';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Consulta inválida' }, { status: 400 });
  try {
    const resultado = await pgPool.query(
      `SELECT c.dni_paciente, c.fecha, c.motivo, c.diagnostico, c.receta, c.dieta,
              COALESCE(p.nombre, 'Paciente') AS paciente
       FROM consultas c LEFT JOIN pacientes p ON p.dni = c.dni_paciente
       WHERE c.id = $1`, [id]
    );
    if (!resultado.rowCount) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    const c = resultado.rows[0];
    const fecha = c.fecha instanceof Date ? c.fecha : new Date(String(c.fecha || ''));
    const fechaTexto = Number.isNaN(fecha.getTime()) ? String(c.fecha || '') : fecha.toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' });
    const pdf = crearPdfConsulta({
      paciente: String(c.paciente), dni: String(c.dni_paciente), fecha: fechaTexto,
      motivo: String(c.motivo || ''), diagnostico: String(c.diagnostico || ''),
      receta: String(c.receta || ''), dieta: String(c.dieta || '')
    });
    return new Response(new Uint8Array(pdf).buffer, { headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="consulta-${id}.pdf"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch (error) {
    console.error('Error al generar PDF de consulta:', error);
    return NextResponse.json({ error: 'No se pudo generar el PDF' }, { status: 500 });
  }
}
