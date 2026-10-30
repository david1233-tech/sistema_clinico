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
  { campo: 'frecuencia_respiratoria', patron: /\b(?:f\.?\s*resp(?:iratoria)?|frecuencia\s+respiratoria|fr)\b/g },
  { campo: 'pulso', patron: /\b(?:pulso|f\.?\s*cardiaca|frecuencia\s+cardiaca|fc)\b/g },
  { campo: 'so2', patron: /\b(?:spo?2|so2|saturacion(?:\s+de\s+oxigeno)?)\b/g },
  { campo: 'temperatura', patron: /\b(?:temperatura|temp)\b|\bt\s*°/g },
  { campo: 'presion_arterial', patron: /\b(?:p\s*\/?\s*a|presion(?:\s+arterial)?|tension\s+arterial)\b/g },
  { campo: 'grasa_visceral', patron: /\b(?:g\.?\s*visc?eral|grasa\s+visc?eral)\b/g },
  { campo: 'grasa_porcentaje', patron: /\bgrasa(?:\s+corporal)?\s*%|\bgrasa\s+corporal\b|\bporcentaje\s+de\s+grasa\b/g },
  { campo: 'musculo_esqueletico_porcentaje', patron: /\b(?:m\.?\s*mus[.\s]*\s*(?:eque|esque)\s*%?|musculo\s+esqueletico\s*%?)\b/g },
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
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/₂/g, '2').toLowerCase();
}

const RANGOS_LECTURA: Partial<Record<Campo, [number, number]>> = {
  edad: [0, 120], talla: [30, 250], peso: [1, 500], imc: [5, 100],
  pulso: [1, 300], so2: [1, 100], temperatura: [20, 45],
  frecuencia_respiratoria: [1, 100], hb: [1, 30],
  grasa_porcentaje: [0, 100], grasa_visceral: [0, 100],
  musculo_esqueletico_porcentaje: [0, 100], musculos_porcentaje: [0, 100],
  agua_porcentaje: [0, 100], proteina: [0, 100],
  edad_metabolica: [0, 120], circunferencia_abdominal: [20, 300],
  hb_glicosilada: [1, 30], vcm: [30, 150],
};

function extraerValor(campo: Campo, segmento: string): string {
  const limpio = segmento
    .replace(/^[\s:;=,.-]+/, '')
    .replace(/^(?:\((?:kg|cm|m|%|mmhg|rpm|lpm|bpm|g\/dl|mg\/dl|°c)\)|(?:kg|cm|mmhg|rpm|lpm|bpm|g\/dl|mg\/dl|%|°c))\s*[:=]?\s*/i, '')
    .trim();
  if (!limpio) return '';
  if (campo === 'nombre_paciente' || campo === 'antecedentes' || campo === 'examenes_solicitados' || campo === 't3_t4_tsh') {
    const texto = limpio.replace(/[|;]+$/, '').trim().slice(0, 150);
    return campo === 'nombre_paciente' && (!/^[a-záéíóúñ]/i.test(texto) || !/[a-záéíóúñ]{2}/i.test(texto)) ? '' : texto;
  }
  if (campo === 'dni_paciente') return limpio.match(/^\d{8}\b/)?.[0] || '';
  if (campo === 'presion_arterial') {
    const presion = limpio.match(/^(\d{2,3})\s*[/|]\s*(\d{2,3})\b/);
    if (!presion || Number(presion[1]) < 30 || Number(presion[1]) > 300 || Number(presion[2]) < 20 || Number(presion[2]) > 200) return '';
    return `${presion[1]}/${presion[2]}`;
  }
  const valor = limpio.match(/^[+-]?\d{1,5}(?:[.,]\d{1,3})?/);
  if (!valor) return '';
  let numero = valor[0].replace(',', '.');
  if (campo === 'talla' && Number(numero) < 3) numero = String(Math.round(Number(numero) * 100));
  const rango = RANGOS_LECTURA[campo];
  if (rango && (Number(numero) < rango[0] || Number(numero) > rango[1])) return '';
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
    const sinValoresEnLinea = etiquetas.length > 1 && etiquetas.every((etiqueta, indice) =>
      !/\d/.test(linea.slice(etiqueta.fin, etiquetas[indice + 1]?.inicio ?? linea.length))
    );
    if (sinValoresEnLinea && lineas[i + 1]) {
      const valores = lineas[i + 1].match(/\d{2,3}\s*[/|]\s*\d{2,3}|[+-]?\d+(?:[.,]\d+)?/g) || [];
      if (valores.length === etiquetas.length) {
        etiquetas.forEach((etiqueta, indice) => {
          const valor = extraerValor(etiqueta.campo, valores[indice]);
          if (valor && !campos[etiqueta.campo]) campos[etiqueta.campo] = valor;
        });
        continue;
      }
    }
    etiquetas.forEach((etiqueta, indice) => {
      const siguiente = etiquetas[indice + 1]?.inicio ?? linea.length;
      const segmento = linea.slice(etiqueta.fin, siguiente);
      let valor = extraerValor(etiqueta.campo, segmento);
      if (!valor && /^[\s:;=().,%°/-]*(?:(?:kg|cm|mmhg|rpm|lpm|g\/dl)[\s:;=().,%°/-]*)?$/i.test(segmento) && lineas[i + 1] && /^[+-]?\d{1,5}(?:[.,]\d+)?(?:\s*[/|]\s*\d{2,3})?(?:\s*(?:kg|cm|mmhg|rpm|lpm|g\/dl|%|°c))?\s*$/i.test(lineas[i + 1])) {
        valor = extraerValor(etiqueta.campo, lineas[i + 1]);
      }
      if (valor && !campos[etiqueta.campo]) campos[etiqueta.campo] = valor;
    });
  }
  return campos;
}

