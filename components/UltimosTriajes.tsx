type RegistroTriaje = Record<string, unknown>;

const campos: { clave: string; etiqueta: string }[] = [
  { clave: 'edad', etiqueta: 'Edad' },
  { clave: 'talla', etiqueta: 'Talla (cm)' },
  { clave: 'peso', etiqueta: 'Peso (kg)' },
  { clave: 'imc', etiqueta: 'IMC' },
  { clave: 'pulso', etiqueta: 'Pulso' },
  { clave: 'so2', etiqueta: 'SO2 (%)' },
  { clave: 'temperatura', etiqueta: 'Temperatura (°C)' },
  { clave: 'presion_arterial', etiqueta: 'Presión arterial (mmHg)' },
  { clave: 'frecuencia_respiratoria', etiqueta: 'Frecuencia respiratoria (rpm)' },
  { clave: 'hb', etiqueta: 'Hemoglobina' },
  { clave: 'glucosa', etiqueta: 'Glucosa' },
  { clave: 'agua_porcentaje', etiqueta: 'Agua (%)' },
  { clave: 'grasa_porcentaje', etiqueta: 'Grasa (%)' },
  { clave: 'grasa_visceral', etiqueta: 'Grasa visceral' },
  { clave: 'musculo_esqueletico_porcentaje', etiqueta: 'Músculo esquelético (%)' },
  { clave: 'musculos_porcentaje', etiqueta: 'Músculos (%)' },
  { clave: 'metabolismo', etiqueta: 'Metabolismo' },
  { clave: 'proteina', etiqueta: 'Proteína' },
  { clave: 'grado_obesidad_porcentaje', etiqueta: 'Grado de obesidad (%)' },
  { clave: 'edad_metabolica', etiqueta: 'Edad metabólica' },
  { clave: 'circunferencia_abdominal', etiqueta: 'Circunferencia abdominal' },
  { clave: 'globulos_rojos', etiqueta: 'Glóbulos rojos' },
  { clave: 'globulos_blancos', etiqueta: 'Glóbulos blancos' },
  { clave: 'hb_glicosilada', etiqueta: 'Hb. glicosilada' },
  { clave: 'vcm', etiqueta: 'VCM' },
  { clave: 'colesterol', etiqueta: 'Colesterol' },
  { clave: 'trigliceridos', etiqueta: 'Triglicéridos' },
  { clave: 'creatinina', etiqueta: 'Creatinina' },
  { clave: 'urea', etiqueta: 'Urea' },
  { clave: 'tgo', etiqueta: 'TGO' },
  { clave: 'tgp', etiqueta: 'TGP' },
  { clave: 't3_t4_tsh', etiqueta: 'T3-T4-TSH' },
  { clave: 'examenes_solicitados', etiqueta: 'Exámenes solicitados' },
  { clave: 'antecedentes', etiqueta: 'Antecedentes' },
  { clave: 'observaciones', etiqueta: 'Observaciones' },
];

function datosRegistrados(registro: RegistroTriaje) {
  return campos.flatMap(({ clave, etiqueta }) => {
    const valor = clave === 'presion_arterial' ? registro.presion_arterial ?? registro.presion
      : clave === 'pulso' ? registro.pulso ?? registro.frecuencia_cardiaca
      : registro[clave];
    return valor === null || valor === undefined || String(valor).trim() === '' ? [] : [{ clave, etiqueta, valor: String(valor) }];
  });
}

function fechaRegistro(registro: RegistroTriaje) {
  const valor = registro.fecha ?? registro.fecha_hora;
  if (!valor) return 'Fecha no registrada';
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString('es-PE', {
    timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short'
  });
}

export default function UltimosTriajes({ registros, error }: { registros: RegistroTriaje[]; error?: string }) {
  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:p-5" aria-label="Últimos registros de triaje">
      <h3 className="m-0 text-base font-extrabold text-teal-900">Últimos triajes registrados</h3>
      <p className="mt-1 text-xs text-slate-600">Datos rellenados en Enfermería, del más reciente al anterior.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>
        : registros.length === 0 ? <p className="mt-3 text-sm text-slate-600">Este paciente aún no tiene triajes registrados.</p>
        : <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {registros.slice(0, 3).map((registro, indice) => {
              const datos = datosRegistrados(registro);
              return <article key={String(registro.id ?? indice)} className="min-w-0 rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="border-b border-teal-100 pb-3">
                  <strong className="block text-sm text-teal-900">{indice === 0 ? 'Triaje más reciente' : `Triaje anterior ${indice}`}</strong>
                  <time className="mt-1 block text-xs font-semibold text-slate-600" dateTime={String(registro.fecha ?? registro.fecha_hora ?? '')}>{fechaRegistro(registro)}</time>
                </div>
                {datos.length ? <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {datos.map(({ clave, etiqueta, valor }) => <div key={clave} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <dt className="font-bold text-slate-600">{etiqueta}</dt>
                    <dd className="m-0 whitespace-pre-wrap break-words text-slate-900">{valor}</dd>
                  </div>)}
                </dl> : <p className="mt-3 text-xs text-slate-500">Sin datos rellenados en este registro.</p>}
              </article>;
            })}
          </div>}
    </section>
  );
}

