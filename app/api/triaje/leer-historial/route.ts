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
          { type: 'text', text: `Transcribe esta foto de un historial o ficha clínica en español. Devuelve únicamente un objeto JSON con los campos que aparecen explícitamente y se leen con seguridad. No inventes datos ni calcules valores. Si hay múltiples fechas, usa los datos de la medición más reciente claramente identificada. Claves permitidas: ${CAMPOS.join(', ')}. Usa DNI de 8 dígitos, talla en cm, peso en kg, temperatura en °C, presión arterial como sistólica/diastólica. Los valores son cadenas. Omite campos ausentes o ilegibles.` },
          { type: 'image_url', image_url: { url: image, detail: 'high' } }
        ] }]
      }),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`El servicio de lectura respondió ${response.status}`);
    const result = await response.json();
    const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}') as Record<string, unknown>;
    const campos = Object.fromEntries(CAMPOS.flatMap(campo => {
      const valor = parsed[campo];
      return typeof valor === 'string' && valor.trim() ? [[campo, valor.trim().slice(0, 500)]] : [];
    }));
    return NextResponse.json({ campos });
  } catch (error) {
    console.error('Error leyendo historial:', error);
    return NextResponse.json({ error: 'No se pudo leer la foto. Intente con una imagen más nítida.' }, { status: 502 });
  }
}

