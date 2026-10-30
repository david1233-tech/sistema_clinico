import { NextResponse } from 'next/server';

const CAMPOS = [
  'dni_paciente', 'nombre_paciente', 'edad', 'talla', 'peso', 'imc', 'pulso', 'so2',
  'temperatura', 'presion_arterial', 'frecuencia_respiratoria', 'hb', 'glucosa',
  'agua_porcentaje', 'grasa_porcentaje', 'grasa_visceral',
  'musculo_esqueletico_porcentaje', 'musculos_porcentaje', 'metabolismo',
  'proteina', 'grado_obesidad_porcentaje', 'edad_metabolica',
  'circunferencia_abdominal', 'globulos_rojos', 'globulos_blancos',
  'hb_glicosilada', 'vcm', 'colesterol', 'trigliceridos', 'creatinina', 'urea',
  'tgo', 'tgp', 't3_t4_tsh', 'examenes_solicitados', 'antecedentes', 'observaciones'
] as const;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Configure OPENAI_API_KEY en el servidor para leer fotos del historial.' }, { status: 503 });

  let archivo: FormDataEntryValue | null;
  try { archivo = (await request.formData()).get('archivo'); }
  catch { return NextResponse.json({ error: 'Imagen inválida.' }, { status: 400 }); }
  if (!(archivo instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size === 0 || archivo.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: 'Use una foto JPG, PNG o WebP de hasta 3 MB.' }, { status: 400 });
  }

  try {
    const image = `data:${archivo.type};base64,${Buffer.from(await archivo.arrayBuffer()).toString('base64')}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: [
          { type: 'text', text: `Lee esta foto de una ficha clínica en español, incluso si está borrosa o tiene sombras. Intenta extraer cada dato que todavía se alcance a distinguir. Devuelve JSON con dos propiedades: "campos", objeto con los valores que puedas asociar con claridad a estas claves: ${CAMPOS.join(', ')}; y "texto_visible", cadena breve con el texto o cifras visibles que no puedas asociar con seguridad a un campo. No inventes valores ni conviertas una cifra dudosa en un dato clínico. Si hay varias fechas, usa la medición más reciente claramente identificada. Usa DNI de 8 dígitos, talla en cm, peso en kg, temperatura en °C y presión arterial como sistólica/diastólica. Todos los valores de "campos" son cadenas; omite los ausentes.` },
          { type: 'image_url', image_url: { url: image, detail: 'high' } }
        ] }]
      }),
      cache: 'no-store'
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      const code = failure?.error?.code || failure?.error?.type;
      console.error('Error del servicio de lectura:', response.status, code || failure?.error?.type);
      if (response.status === 401) return NextResponse.json({ error: 'La clave OPENAI_API_KEY no es válida. Revísela en Vercel y vuelva a desplegar.' }, { status: 502 });
      if (response.status === 429) {
        const sinCredito = ['credit_balance_exhausted', 'insufficient_quota', 'organization_spend_limit_exceeded', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded'].includes(code);
        return NextResponse.json({ error: sinCredito ? 'La cuenta de OpenAI API no tiene saldo disponible o alcanzó su límite de gasto. Revise Billing y Limits en OpenAI Platform.' : 'El servicio de lectura recibió demasiadas solicitudes. Espere un momento e intente de nuevo.' }, { status: 503 });
      }
      if (response.status === 403) return NextResponse.json({ error: 'La clave no tiene permiso para usar el servicio de lectura. Revise los permisos del proyecto en OpenAI Platform.' }, { status: 502 });
      if (response.status === 400 || response.status === 404) return NextResponse.json({ error: 'El servicio rechazó la foto o el modelo configurado. Revise OPENAI_VISION_MODEL y el acceso del proyecto a ese modelo.' }, { status: 502 });
      return NextResponse.json({ error: 'El servicio de lectura no está disponible en este momento. Intente más tarde.' }, { status: 502 });
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('El servicio no devolvió texto');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const origen = parsed.campos && typeof parsed.campos === 'object' && !Array.isArray(parsed.campos) ? parsed.campos as Record<string, unknown> : parsed;
    const campos = Object.fromEntries(CAMPOS.flatMap(campo => {
      const valor = origen[campo];
      return (typeof valor === 'string' || typeof valor === 'number') && String(valor).trim() ? [[campo, String(valor).trim().slice(0, 500)]] : [];
    }));
    const texto_visible = typeof parsed.texto_visible === 'string' ? parsed.texto_visible.trim().slice(0, 1500) : '';
    return NextResponse.json({ campos, texto_visible });
  } catch (error) {
    console.error('Error leyendo historial:', error);
    return NextResponse.json({ error: 'No se pudo completar la lectura por un error técnico. Intente de nuevo en unos momentos.' }, { status: 502 });
  }
}

