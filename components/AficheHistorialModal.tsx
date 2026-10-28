'use client';
import { useState } from 'react';

interface Props {
  paciente: any;
  triajes: any[];
  consultas: any[];
  internamiento?: any;
  tratamientos?: any[];
}

export default function AficheHistorialModal({
  paciente,
  triajes,
  consultas,
  internamiento,
  tratamientos = [],
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [recetaModal, setRecetaModal] = useState<any>(null);
  const [imagenModal, setImagenModal] = useState<string | null>(null);

  const imprimirAfiche = () => {
    const vent = window.open('', '_blank');
    if (!vent) return;
    let htmlInternamiento = '';
    if (paciente.es_internado || internamiento) {
      htmlInternamiento = `
        <div class="sec-header">🏥 Información de Hospitalización / Internamiento</div>
        <table class="patient-table">
          <tr>
            <td class="label">Estado:</td>
            <td class="value" style="color: #b45309;">HOSPITALIZADO / INTERNADO</td>
            <td class="label">Cama Asignada:</td>
            <td class="value">${paciente.cama_asignada || internamiento?.cama || 'Cama por asignar'}</td>
          </tr>
          <tr>
            <td class="label">Fecha Ingreso:</td>
            <td class="value">${internamiento?.fecha_ingreso ? new Date(internamiento.fecha_ingreso).toLocaleString('es-PE') : 'En curso'}</td>
            <td class="label">Motivo Internamiento:</td>
            <td class="value">${internamiento?.motivo || 'Evaluación y observación médica continua'}</td>
          </tr>
        </table>
      `;
    }
    let htmlConsultas = '';
    if (consultas && consultas.length > 0) {
      htmlConsultas = consultas
        .map(
          (c) => `
        <tr style="background: #fafafa;">
          <td style="font-weight: bold; white-space: nowrap;">${c.fecha || '-'}</td>
          <td><strong>${c.motivo || c.motivo_consulta || 'Atención Médica'}</strong></td>
          <td>${c.diagnostico || 'Evaluación general'}</td>
          <td>
            ${c.receta ? `<div><strong>Receta:</strong> ${c.receta}</div>` : ''}
            ${c.dieta ? `<div style="margin-top: 4px; color: #6b21a8;"><strong>Dieta:</strong> ${c.dieta.replace(/\n/g, '<br>')}</div>` : ''}
          </td>
          <td style="white-space: nowrap;">${c.medico || 'Dr. Administrador'}</td>
        </tr>
      `
        )
        .join('');
    } else {
      htmlConsultas = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">Sin consultas médicas registradas</td></tr>`;
    }

    let htmlTratamientos = '';
    if (tratamientos && tratamientos.length > 0) {
      htmlTratamientos = tratamientos
        .map(
          (m) => `
        <tr style="background: #fafafa;">
          <td style="white-space: nowrap;">${m.fecha ? new Date(m.fecha).toLocaleDateString('es-PE') : '-'}</td>
          <td><strong>${m.medicamento || m.receta || m.producto || 'Tratamiento'}</strong></td>
          <td>${m.dosis || '-'}</td>
          <td>${m.via || 'Oral / Ev'}</td>
          <td>${m.indicaciones || m.frecuencia || 'Según indicación médica'}</td>
        </tr>
      `
        )
        .join('');
    } else {
      htmlTratamientos = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">Sin medicamentos o procedimientos registrados</td></tr>`;
    }

    let htmlTriajes = '';
    if (triajes && triajes.length > 0) {
      htmlTriajes = triajes
        .map(
          (t) => `
        <tr>
          <td>${t.fecha ? new Date(t.fecha).toLocaleDateString('es-PE') : '-'}</td>
          <td>${t.temperatura ? `${t.temperatura}°C` : '-'}</td>
          <td>${t.presion_arterial || t.presion || '-'}</td>
          <td>${t.peso ? `${t.peso} kg` : '-'}</td>
          <td>${t.talla ? `${t.talla} cm` : '-'}</td>
          <td>${t.imc || '-'}</td>
          <td>${t.pulso ? `${t.pulso} bpm` : '-'}</td>
          <td>${t.so2 ? `${t.so2}%` : '-'}</td>
        </tr>
      `
        )
        .join('');
    } else {
      htmlTriajes = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 12px;">Sin triajes registrados</td></tr>`;
    }

    vent.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Afiche Clínico Unificado - ${paciente.nombre}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 0; }
            .sheet { width: 100%; max-width: 800px; margin: auto; padding: 10px; box-sizing: border-box; }
            .action-bar { display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 12px; margin-bottom: 15px; }
            .btn-return { background-color: #0f172a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; }
            .btn-print { background-color: #0d9488; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0d9488; padding-bottom: 10px; margin-bottom: 15px; }
            .brand-logo { font-size: 26px; font-weight: 900; color: #0d9488; }
            .brand-logo span { color: #84cc16; }
            .brand-sub { font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 1px; display: block; }
            .header-title { text-align: right; }
            .header-title h1 { margin: 0; font-size: 18px; color: #0d9488; font-weight: 900; }
            .header-title h3 { margin: 2px 0 0; font-size: 10px; color: #0f172a; font-weight: 800; text-transform: uppercase; background: #e0f2fe; display: inline-block; padding: 3px 10px; border-radius: 4px; border: 1px solid #bae6fd; }
            .patient-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
            .patient-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
            .patient-table .label { background-color: #f1f5f9; font-weight: 800; color: #334155; width: 22%; text-transform: uppercase; font-size: 10px; }
            .patient-table .value { font-weight: 700; color: #0f172a; }
            .sec-header { background-color: #0d9488; color: #ffffff; padding: 6px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 4px 4px 0 0; margin-top: 15px; }
            .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11.5px; }
            .grid-table th { border: 1px solid #94a3b8; background-color: #f8fafc; color: #334155; padding: 6px; font-size: 10px; text-transform: uppercase; font-weight: 800; text-align: center; }
            .grid-table td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; font-weight: 600; color: #0f172a; }
            @media print {
              .action-bar { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="action-bar">
              <button onclick="window.close()" class="btn-return">⬅ Volver</button>
              <button onclick="window.print()" class="btn-print">🖨️ Imprimir Afiche Completo</button>
            </div>
            <div class="header-container">
              <div>
                <div class="brand-logo">Vital<span>Salud</span></div>
                <span class="brand-sub">CENTRO DE REHABILITACIÓN NATURAL</span>
              </div>
              <div class="header-title">
                <h1>VITAL SALUD</h1>
                <h3>AFICHE Y EXPEDIENTE CLÍNICO INTEGRAL</h3>
              </div>
            </div>
            <table class="patient-table">
              <tr>
                <td class="label">Paciente:</td>
                <td class="value" colspan="3">${paciente.nombre}</td>
              </tr>
              <tr>
                <td class="label">DNI:</td>
                <td class="value">${paciente.dni}</td>
                <td class="label">Edad / Género:</td>
                <td class="value">${paciente.edad || 'N/A'} años • ${paciente.genero || 'Femenino'}</td>
              </tr>
              <tr>
                <td class="label">Teléfono:</td>
                <td class="value">${paciente.telefono || 'Sin teléfono'}</td>
                <td class="label">Dirección:</td>
                <td class="value">${paciente.direccion || 'Sin dirección'}</td>
              </tr>
            </table>
            ${htmlInternamiento}
            <div class="sec-header">1. Consultas, Recetas y Dietas Especializadas</div>
            <table class="grid-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Fecha</th>
                  <th style="width: 20%;">Motivo</th>
                  <th style="width: 20%;">Diagnóstico</th>
                  <th style="width: 35%;">Receta y Dieta Vital Salud</th>
                  <th style="width: 10%;">Médico</th>
                </tr>
              </thead>
              <tbody>
                ${htmlConsultas}
              </tbody>
            </table>
            <div class="sec-header">2. Medicamentos y Tratamientos Adicionales</div>
            <table class="grid-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Medicamento / Receta</th>
                  <th>Dosis</th>
                  <th>Vía</th>
                  <th>Indicaciones</th>
                </tr>
              </thead>
              <tbody>
                ${htmlTratamientos}
              </tbody>
            </table>
            <div class="sec-header">3. Control Histórico de Triajes y Signos Vitales</div>
            <table class="grid-table" style="text-align: center;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Temp</th>
                  <th>P/A</th>
                  <th>Peso</th>
                  <th>Talla</th>
                  <th>IMC</th>
                  <th>Pulso</th>
                  <th>SO₂</th>
                </tr>
              </thead>
              <tbody>
                ${htmlTriajes}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  const imprimirRecetaIndividual = (c: any) => {
    const vent = window.open('', '_blank');
    if (!vent) return;

    vent.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receta y Dieta Médica - ${paciente.nombre}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 0; }
            .sheet { width: 100%; max-width: 750px; margin: auto; padding: 25px; box-sizing: border-box; border: 2px solid #0d9488; border-radius: 12px; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0d9488; font-size: 20px; text-transform: uppercase; font-weight: 900; }
            .header p { margin: 3px 0; font-size: 12px; color: #64748b; font-weight: 600; }
            .patient-box { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0; }
            .section-title { font-size: 12px; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; }
            .box-content { font-size: 13px; background: #fdfdfd; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-line; line-height: 1.5; color: #1e293b; }
            .footer { margin-top: 50px; display: flex; justify-content: flex-end; align-items: center; }
            .signature { text-align: center; width: 250px; border-top: 1px solid #0f172a; padding-top: 5px; font-size: 12px; font-weight: bold; }
            .action-bar { display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 12px; margin-bottom: 20px; max-width: 750px; margin-left: auto; margin-right: auto; }
            .btn-return { background-color: #0f172a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; }
            .btn-print { background-color: #7c3aed; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; }
            @media print { .action-bar { display: none !important; } body { padding: 0; } .sheet { border: none; } }
          </style>
        </head>
        <body>
          <div class="action-bar">
            <button onclick="window.close()" class="btn-return">⬅ Volver</button>
            <button onclick="window.print()" class="btn-print">🖨️ Imprimir Receta y Dieta</button>
          </div>
          <div class="sheet">
            <div class="header">
              <h1>Centro de Rehabilitación Natural Vital Salud</h1>
              <p>Receta Médica y Plan Nutricional Especializado</p>
              <p>Fecha de Atención: ${c.fecha || '-'}</p>
            </div>
            
            <div class="patient-box">
              <p style="margin: 0 0 5px 0;"><strong>Paciente:</strong> ${paciente.nombre}</p>
              <p style="margin: 0;"><strong>DNI:</strong> ${paciente.dni} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Edad:</strong> ${paciente.edad || 'N/A'} años</p>
            </div>

            <div class="section-title">Diagnóstico Clínico</div>
            <div class="box-content">${c.diagnostico || 'Sin diagnóstico registrado.'}</div>

            <div class="section-title">Prescripción / Receta Médica</div>
            <div class="box-content">💊 ${c.receta || 'Sin medicamentos prescritos.'}</div>

            <div class="section-title">Dieta Especializada (Vital Salud)</div>
            <div class="box-content" style="color: #6b21a8; font-weight: 500;">🥗 ${c.dieta || 'Sin dieta asignada.'}</div>

            <div class="footer">
              <div class="signature">
                Dr. Administrador<br/>
                <span style="font-weight: normal; font-size: 10px; color: #64748b;">Especialista Vital Salud</span>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-sm transition-all flex items-center gap-1.5 shrink-0 border-none"
      >
        <span>📄</span> Ver Afiche Completo e Imprimir
      </button>

      {/* MODAL DE VISTA PREVIA COMPLETA EN PANTALLA */}
      {abierto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            
            {/* CABECERA DEL MODAL */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-teal-400 font-extrabold text-[10px] uppercase tracking-wider block">
                  Expediente Clínico Unificado
                </span>
                <h2 className="text-base sm:text-lg font-black m-0 text-white">
                  Afiche de Historial: {paciente.nombre} (DNI: {paciente.dni})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={imprimirAfiche}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1 border-none"
                >
                  🖨️ Imprimir Afiche
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer border border-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* CUERPO DEL AFICHE UNIFICADO */}
            <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs sm:text-sm">
              
              {/* DATOS PERSONALES Y HOSPITALIZACIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block">Paciente</span>
                  <strong className="text-slate-900">{paciente.nombre}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block">Teléfono / Dirección</span>
                  <strong className="text-slate-900">{paciente.telefono || 'Sin telf.'} / {paciente.direccion || 'Sin dir.'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block">Estado Hospitalario</span>
                  <strong className={paciente.es_internado || internamiento ? 'text-amber-600 font-black' : 'text-emerald-600'}>
                    {paciente.es_internado || internamiento ? `🏥 Internado (${paciente.cama_asignada || internamiento?.cama || 'Cama por asignar'})` : '🟢 Ambulatorio'}
                  </strong>
                </div>
              </div>

              {/* MOTIVO DE INTERNAMIENTO SI APLICA */}
              {internamiento && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900">
                  <span className="font-extrabold block text-[11px] uppercase text-amber-800">
                    🏥 Detalle del Internamiento Actual
                  </span>
                  <p className="m-0 mt-1 font-semibold">
                    <strong>Ingreso:</strong> {new Date(internamiento.fecha_ingreso).toLocaleString('es-PE')} | <strong>Cama:</strong> {internamiento.cama || paciente.cama_asignada}
                  </p>
                  <p className="m-0 mt-1"><strong>Motivo:</strong> {internamiento.motivo || 'Evaluación médica continua'}</p>
                </div>
              )}

              {/* SECCIÓN 1: CONSULTAS Y RECETAS */}
              <div className="border border-teal-600/30 rounded-2xl overflow-hidden">
                <div className="bg-teal-700 text-white px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>1. Consultas, Recetas y Dietas Especializadas</span>
                  <span className="bg-teal-800 px-2 py-0.5 rounded text-[10px]">{consultas.length} Atenciones</span>
                </div>
                <div className="p-3 bg-white">
                  {consultas.length === 0 ? (
                    <p className="text-slate-400 italic m-0">No se registran consultas ni recetas médicas.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {consultas.map((c, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex flex-col gap-1 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-teal-700">📅 {c.fecha || '-'}</span>
                              <span className="text-[11px] font-extrabold text-slate-700">Atendido por: {c.medico || 'Dr. Administrador'}</span>
                            </div>
                            <strong className="text-slate-900 text-xs sm:text-sm">Motivo: {c.motivo || c.motivo_consulta || 'N/A'}</strong>
                            <p className="m-0 text-slate-600 text-xs"><strong>Diagnóstico:</strong> {c.diagnostico || 'N/A'}</p>
                            {c.receta && <p className="m-0 text-teal-900 text-xs font-bold"><strong>Receta:</strong> {c.receta}</p>}
                            {c.dieta && <p className="m-0 text-purple-900 text-xs line-clamp-2"><strong>Dieta:</strong> {c.dieta}</p>}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRecetaModal(c)}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5 border-none"
                            >
                              👁️ Ver Receta y Dieta
                            </button>
                            {c.imagen_url && (
                              <button
                                type="button"
                                onClick={() => setImagenModal(c.imagen_url)}
                                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm border-none"
                                title="Ver examen adjunto"
                              >
                                🖼️
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: TRATAMIENTOS ADICIONALES */}
              <div className="border border-teal-600/30 rounded-2xl overflow-hidden">
                <div className="bg-teal-700 text-white px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider">
                  2. Medicamentos y Tratamientos Adicionales
                </div>
                <div className="p-3 bg-white">
                  {tratamientos.length === 0 ? (
                    <p className="text-slate-400 italic m-0">No se registran tratamientos o medicamentos administrados.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {tratamientos.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                          <div>
                            <strong className="text-slate-900 block mb-0.5">
                              💊 {m.medicamento || m.receta || m.producto || 'Tratamiento Prescrito'}
                            </strong>
                            <div className="text-slate-600 flex flex-wrap gap-2 text-xs">
                              {m.dosis && <span><strong>Dosis:</strong> {m.dosis}</span>}
                              {m.via && <span>• <strong>Vía:</strong> {m.via}</span>}
                              {m.indicaciones && <span>• <strong>Indicaciones:</strong> {m.indicaciones}</span>}
                            </div>
                          </div>
                          <span className="text-slate-400 font-semibold text-[11px] shrink-0 ml-2">
                            {m.fecha ? new Date(m.fecha).toLocaleDateString('es-PE') : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 3: TRIAJES */}
              <div className="border border-teal-600/30 rounded-2xl overflow-hidden">
                <div className="bg-teal-700 text-white px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider">
                  3. Historial de Triajes y Signos Vitales
                </div>
                <div className="p-3 bg-white">
                  {triajes.length === 0 ? (
                    <p className="text-slate-400 italic m-0">No hay triajes registrados.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-black border-b border-slate-200">
                            <th className="p-2">Fecha</th>
                            <th className="p-2">Temp</th>
                            <th className="p-2">P/A</th>
                            <th className="p-2">Peso</th>
                            <th className="p-2">Talla</th>
                            <th className="p-2">IMC</th>
                            <th className="p-2">Pulso</th>
                            <th className="p-2">SO₂</th>
                          </tr>
                        </thead>
                        <tbody>
                          {triajes.map((t, idx) => (
                            <tr key={idx} className="font-bold text-slate-800 border-b border-slate-100">
                              <td className="p-2">{t.fecha ? new Date(t.fecha).toLocaleDateString('es-PE') : '-'}</td>
                              <td className="p-2">{t.temperatura ? `${t.temperatura}°C` : '-'}</td>
                              <td className="p-2">{t.presion_arterial || t.presion || '-'}</td>
                              <td className="p-2">{t.peso ? `${t.peso}kg` : '-'}</td>
                              <td className="p-2">{t.talla ? `${t.talla}cm` : '-'}</td>
                              <td className="p-2">{t.imc || '-'}</td>
                              <td className="p-2">{t.pulso ? `${t.pulso} bpm` : '-'}</td>
                              <td className="p-2">{t.so2 ? `${t.so2}%` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* PIE DEL MODAL */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-none"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={imprimirAfiche}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5 border-none"
              >
                <span>🖨️</span> Imprimir Afiche Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA DE RECETA Y DIETA INDIVIDUAL CON BOTÓN DE IMPRESIÓN */}
      {recetaModal && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-purple-300 font-extrabold text-[10px] uppercase tracking-wider block">
                  Documento Oficial • Vital Salud
                </span>
                <h3 className="m-0 text-base font-black text-white">Vista Previa de Receta y Dieta</h3>
              </div>
              <button
                type="button"
                onClick={() => setRecetaModal(null)}
                className="bg-purple-800 text-white w-8 h-8 rounded-lg font-bold text-sm cursor-pointer flex items-center justify-center border-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="m-0 text-xs text-slate-500 font-bold">PACIENTE:</p>
                <p className="m-0 text-sm font-black text-slate-900 uppercase">{paciente.nombre} (DNI: {paciente.dni})</p>
                <p className="m-0 text-xs text-slate-500 mt-2"><strong>Fecha de atención:</strong> {recetaModal.fecha}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-[11px] font-extrabold text-teal-700 uppercase">Diagnóstico Clínico</span>
                <p className="m-0 text-slate-800 font-semibold">{recetaModal.diagnostico || 'Sin diagnóstico'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase">Prescripción / Receta Médica</span>
                <p className="m-0 text-slate-900 font-bold whitespace-pre-line">{recetaModal.receta || 'Sin medicamentos'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col gap-1 bg-purple-50/30">
                <span className="text-[11px] font-extrabold text-purple-800 uppercase">Dieta Especializada (Vital Salud)</span>
                <p className="m-0 text-purple-950 font-medium whitespace-pre-line text-xs sm:text-sm">{recetaModal.dieta || 'Sin dieta asignada'}</p>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecetaModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border-none"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => imprimirRecetaIndividual(recetaModal)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5 border-none"
              >
                🖨️ Imprimir Receta y Dieta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECUNDARIO PARA VER IMAGEN ADJUNTA */}
      {imagenModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
              <h3 className="m-0 text-sm font-extrabold text-slate-900">Imagen / Examen Adjunto</h3>
              <button
                type="button"
                onClick={() => setImagenModal(null)}
                className="bg-slate-800 text-white w-8 h-8 rounded-lg font-bold text-sm cursor-pointer flex items-center justify-center border-none"
              >
                ✕
              </button>
            </div>
            <div className="w-full max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img src={imagenModal} alt="Examen adjunto" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
