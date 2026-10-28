import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [triajes]: any = await pool.query('SELECT * FROM triaje ORDER BY id DESC');
    return NextResponse.json(triajes);
  } catch (error) {
    console.error('Error al obtener triajes:', error);
    return NextResponse.json({ error: 'Error interno al obtener triajes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let dni_paciente = '';
    let nombre_paciente = '';
    let edad = '';
    let talla = '';
    let peso = '';
    let imc = '';
    let pulso = '';
    let so2 = '';
    let temperatura = '';
    let hb = '';
    let presion = '';
    let observaciones = '';
    
    const contentType = request.headers.get('content-type') || '';
    
    // Soporte tanto para FormData como para JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      dni_paciente = formData.get('dni_paciente')?.toString() || '';
      nombre_paciente = formData.get('nombre_paciente')?.toString() || '';
      edad = formData.get('edad')?.toString() || '';
      talla = formData.get('talla')?.toString() || '';
      peso = formData.get('peso')?.toString() || '';
      imc = formData.get('imc')?.toString() || '';
      pulso = formData.get('pulso')?.toString() || formData.get('frecuencia_cardiaca')?.toString() || '';
      so2 = formData.get('so2')?.toString() || '';
      temperatura = formData.get('temperatura')?.toString() || '';
      hb = formData.get('hb')?.toString() || '';
      presion = formData.get('presion')?.toString() || '';
      observaciones = formData.get('observaciones')?.toString() || '';
    } else {
      const body = await request.json();
      dni_paciente = body.dni_paciente || '';
      nombre_paciente = body.nombre_paciente || '';
      edad = body.edad || '';
      talla = body.talla || '';
      peso = body.peso || '';
      imc = body.imc || '';
      pulso = body.pulso || body.frecuencia_cardiaca || '';
      so2 = body.so2 || '';
      temperatura = body.temperatura || '';
      hb = body.hb || '';
      presion = body.presion || '';
      observaciones = body.observaciones || '';
    }

    if (!dni_paciente) {
      return NextResponse.json({ error: 'El DNI del paciente es obligatorio' }, { status: 400 });
    }

    // Insertar en la base de datos MySQL
    const [result]: any = await pool.query(
      `INSERT INTO triaje 
        (dni_paciente, nombre_paciente, edad, talla, peso, imc, pulso, so2, temperatura, hb, presion, observaciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dni_paciente,
        nombre_paciente || 'Paciente Sin Nombre',
        edad || null,
        talla || null,
        peso || null,
        imc || null,
        pulso || null,
        so2 || null,
        temperatura || null,
        hb || null,
        presion || null,
        observaciones || ''
      ]
    );

    const nuevoTriaje = {
      id: result.insertId,
      dni_paciente,
      nombre_paciente: nombre_paciente || 'Paciente Sin Nombre',
      edad,
      talla,
      peso,
      imc,
      pulso,
      so2,
      temperatura,
      hb,
      presion,
      observaciones,
      fecha: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Triaje guardado exitosamente',
      data: nuevoTriaje
    });
  } catch (error) {
    console.error('Error interno al guardar triaje:', error);
    return NextResponse.json({ error: 'Error interno al guardar triaje en la BD' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de registro requerido' }, { status: 400 });
    }
    await pool.query('DELETE FROM triaje WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Triaje eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar triaje:', error);
    return NextResponse.json({ error: 'Error interno al eliminar el triaje' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE triaje SET dni_paciente = ?, nombre_paciente = ?, edad = ?, talla = ?, peso = ?, imc = ?,
       pulso = ?, so2 = ?, temperatura = ?, hb = ?, presion = ?, observaciones = ? WHERE id = ?`,
      [String(body.dni_paciente ?? ''), String(body.nombre_paciente ?? ''), body.edad ? String(body.edad) : null,
        body.talla ? String(body.talla) : null, body.peso ? String(body.peso) : null,
        body.imc ? String(body.imc) : null, body.pulso ? String(body.pulso) : null,
        body.so2 ? String(body.so2) : null, body.temperatura ? String(body.temperatura) : null,
        body.hb ? String(body.hb) : null, body.presion ? String(body.presion) : null,
        String(body.observaciones ?? ''), String(body.id)]
    );
    if (!result.affectedRows) return NextResponse.json({ error: 'Triaje no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar triaje:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el triaje' }, { status: 503 });
  }
}

