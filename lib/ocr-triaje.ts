type Campo =
  | 'dni_paciente' | 'nombre_paciente' | 'edad' | 'talla' | 'peso' | 'imc'
  | 'pulso' | 'so2' | 'temperatura' | 'presion_arterial' | 'frecuencia_respiratoria'
  | 'grasa_porcentaje' | 'grasa_visceral' | 'musculo_esqueletico_porcentaje'
  | 'musculos_porcentaje' | 'agua_porcentaje' | 'metabolismo' | 'proteina'
  | 'grado_obesidad_porcentaje' | 'edad_metabolica' | 'circunferencia_abdominal'
  | 'hb' | 'globulos_rojos' | 'globulos_blancos' | 'hb_glicosilada' | 'vcm'
  | 'glucosa' | 'colesterol' | 'trigliceridos' | 'creatinina' | 'urea'
  | 'tgo' | 'tgp' | 't3_t4_tsh' | 'antecedentes' | 'examenes_solicitados';

const ETIQUETAS: { campo: Campo; patron: RegExp }[] = [
  { campo: 'dni_paciente', patron: /\b(?:dni|documento(?:\s+de\s+identidad)?)\b/g },
  { campo: 'nombre_paciente', patron: /\b(?:nombre(?:\s+(?:del\s+)?paciente)?|paciente)\b/g },
  { campo: 'edad_metabolica', patron: /\bedad\s+metabolica\b/g },
  { campo: 'edad', patron: /\bedad\b/g },
  { campo: 'talla', patron: /\b(?:talla|estatura|altura)\b/g },
  { campo: 'peso', patron: /\bpeso\b/g },
  { campo: 'imc', patron: /\b(?:imc|indice\s+de\s+masa\s+corporal)\b/g },
  { campo: 'frecuencia_respiratoria', patron: /\b(?:f\.?\s*respiratoria|frecuencia\s+respiratoria|fr)\b/g },
  { campo: 'pulso', patron: /\b(?:pulso|f\.?\s*cardiaca|frecuencia\s+cardiaca|fc)\b/g },
  { campo: 'so2', patron: /\b(?:spo?2|saturacion(?:\s+de\s+oxigeno)?)\b/g },
  { campo: 'temperatura', patron: /\b(?:temperatura|temp)\b|\bt\s*°/g },
  { campo: 'presion_arterial', patron: /\b(?:p\s*\/?\s*a|presion\s+arterial|tension\s+arterial)\b/g },
  { campo: 'grasa_visceral', patron: /\b(?:g\.?\s*visceral|grasa\s+visceral)\b/g },
  { campo: 'grasa_porcentaje', patron: /\bgrasa(?:\s+corporal)?\s*%|\bgrasa\s+corporal\b|\bporcentaje\s+de\s+grasa\b/g },
  { campo: 'musculo_esqueletico_porcentaje', patron: /\b(?:m\.?\s*mus\.?\s*eque\s*%?|musculo\s+esqueletico\s*%?)\b/g },
  { campo: 'musculos_porcentaje', patron: /\bmusculos?\s*%?\b/g },
  { campo: 'agua_porcentaje', patron: /\bagua\s*%?\b/g },
  { campo: 'metabolismo', patron: /\b(?:metabolismo(?:\s+basal)?|tasa\s+metabolica)\b/g },
  { campo: 'proteina', patron: /\bproteina\s*%?\b/g },
  { campo: 'grado_obesidad_porcentaje', patron: /\bgrado\s+(?:de\s+)?obesidad\s*%?\b/g },
  { campo: 'circunferencia_abdominal', patron: /\b(?:circunferencia|circunf\.?|perimetro)\s+abdominal\b/g },
  { campo: 'hb_glicosilada', patron: /\b(?:hb\.?\s*glicosilada|hemoglobina\s+glicosilada|hba1c)\b/g },
  { campo: 'hb', patron: /\b(?:hb|hemoglobina)\b/g },
  { campo: 'globulos_rojos', patron: /\b(?:g\.?\s*rojos|globulos\s+rojos|eritrocitos)\b/g },
  { campo: 'globulos_blancos', patron: /\b(?:g\.?\s*blancos|globulos\s+blancos|leucocitos)\b/g },
  { campo: 'vcm', patron: /\bvcm\b/g },
  { campo: 'glucosa', patron: /\b(?:glucosa|glicemia)\b/g },
  { campo: 'colesterol', patron: /\bcolesterol\b/g },
  { campo: 'trigliceridos', patron: /\btrigliceridos\b/g },
  { campo: 'creatinina', patron: /\bcreatinina\b/g },
  { campo: 'urea', patron: /\burea\b/g },
  { campo: 'tgo', patron: /\b(?:tgo|ast)\b/g },
  { campo: 'tgp', patron: /\b(?:tgp|alt)\b/g },
  { campo: 't3_t4_tsh', patron: /\b(?:t3\s*[-/]\s*t4\s*[-/]\s*tsh|tsh)\b/g },
  { campo: 'antecedentes', patron: /\bantecedentes(?:\s+medicos)?\b/g },
  { campo: 'examenes_solicitados', patron: /\bexamenes\s+solicitados\b/g },
];

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function extraerValor(campo: Campo, segmento: string): string {
  const limpio = segmento.replace(/^[\s:;=,.-]+/, '').trim();
  if (!limpio) return '';
  if (campo === 'nombre_paciente' || campo === 'antecedentes' || campo === 'examenes_solicitados' || campo === 't3_t4_tsh') {
    const texto = limpio.replace(/[|;]+$/, '').trim().slice(0, 150);
    return campo === 'nombre_paciente' && !/[a-záéíóúñ]{2}/i.test(texto) ? '' : texto;
  }
  if (campo === 'dni_paciente') return limpio.match(/\b\d{8}\b/)?.[0] || '';
  if (campo === 'presion_arterial') return limpio.match(/\b\d{2,3}\s*[/|]\s*\d{2,3}\b/)?.[0].replace(/[\s|]/g, '').replace('|', '/') || '';
  const valor = limpio.match(/[+-]?\d{1,5}(?:[.,]\d{1,3})?/);
  if (!valor) return '';
  const numero = valor[0].replace(',', '.');
  if (campo === 'talla' && /^\d[.,]\d{1,2}\s*m(?:\b|$)/i.test(limpio)) return String(Math.round(Number(numero) * 100));
  return numero;
}

export function extraerDatosTriaje(texto: string): Partial<Record<Campo, string>> {
  const campos: Partial<Record<Campo, string>> = {};
  const lineas = texto.split(/\r?\n/).map(linea => linea.trim()).filter(Boolean);
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const normalizada = normalizar(linea);
    const hallazgos = ETIQUETAS.flatMap(({ campo, patron }) =>
      Array.from(normalizada.matchAll(patron), coincidencia => ({ campo, inicio: coincidencia.index, fin: coincidencia.index + coincidencia[0].length }))
    ).sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);
    const etiquetas = hallazgos.filter((actual, indice) => !hallazgos.slice(0, indice).some(otra => otra.inicio <= actual.inicio && otra.fin > actual.inicio));
    etiquetas.forEach((etiqueta, indice) => {
      const siguiente = etiquetas[indice + 1]?.inicio ?? linea.length;
      let segmento = linea.slice(etiqueta.fin, siguiente);
      if (!segmento.trim() && lineas[i + 1] && /^\s*[:=]?[\s\d.,/+%-]/.test(lineas[i + 1])) segmento = lineas[i + 1];
      const valor = extraerValor(etiqueta.campo, segmento);
      if (valor && !campos[etiqueta.campo]) campos[etiqueta.campo] = valor;
    });
  }
  return campos;
}

