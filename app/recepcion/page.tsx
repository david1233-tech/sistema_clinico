'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NuevoPacienteModal from '@/components/NuevoPacienteModal';
import BotonSeleccionarPaciente from '@/components/BotonSeleccionarPaciente';

function RecepcionPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const dniBuscado = dniParam ? dniParam.replace(/\D/g, '').trim() : '';
  const [paciente, setPaciente] = useState<any>(null);
  const [triajes, setTriajes] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [ultimosPacientes, setUltimosPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estados para modales y navegación por pestañas en la tarjeta del paciente
  const [mostrarModalReceta, setMostrarModalReceta] = useState<boolean>(false);
  const [mostrarModalImagen, setMostrarModalImagen] = useState<boolean>(false);
  const [consultaImprimir, setConsultaImprimir] = useState<any>(null);
  const [tipoImpresion, setTipoImpresion] = useState<'receta' | 'historial'>('receta');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'imagen' | 'consultas'>('resumen');
  const [consultasDesplegadas, setConsultasDesplegadas] = useState<boolean>(true);

  useEffect(() => {
    fetchDatosRecepcion();
  }, [dniBuscado]);

  const fetchDatosRecepcion = async () => {
    try {
      setLoading(true);
      
      let dataTodos: any[] = [];
      try {
        const resTodos = await fetch('/api/pacientes', { cache: 'no-store' });
        if (!resTodos.ok) throw new Error((await resTodos.json()).error || 'No se pudo cargar pacientes');
        dataTodos = await resTodos.json();
      } catch (e) {
        console.error('No se pudo cargar pacientes:', e);
        alert(e instanceof Error ? e.message : 'No se pudo cargar pacientes');
        return;
      }

      setUltimosPacientes(dataTodos.slice(0, 15));

      if (dniBuscado !== '') {
        const encontrado = dataTodos.find(
          (p: any) => String(p.dni || p.dni_paciente).trim() === dniBuscado
        );
        if (encontrado) {
          setPaciente(encontrado);
          const dniFinal = encontrado.dni || encontrado.dni_paciente;
          
          try {
            const resTriaje = await fetch(`/api/triaje?dni=${dniFinal}`);
            if (resTriaje.ok) setTriajes(await resTriaje.json());
          } catch (e) {}

          try {
            const resCons = await fetch(`/api/consulta?dni=${dniFinal}`);
            if (resCons.ok) {
              const consData = await resCons.json();
              setConsultas(consData);
              if (consData.length > 0) {
                setConsultaImprimir(consData[0]);
              } else {
                setConsultaImprimir(null);
              }
            }
          } catch (e) {}

          try {
            const resRecetas = await fetch(`/api/recetas?dni=${dniFinal}`);
            if (resRecetas.ok) setTratamientos(await resRecetas.json());
          } catch (e) {}

        } else {
          setPaciente(null);
        }
      } else {
        setPaciente(null);
      }
    } catch (error) {
      console.error('Error al cargar datos en recepción:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPaciente = async (pacienteItem: any) => {
    if (confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      const identifier = pacienteItem.id || pacienteItem.dni || pacienteItem.dni_paciente;
      
      try {
        const response = await fetch(`/api/pacientes?id=${encodeURIComponent(identifier)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar el paciente');
      } catch (apiErr) {
        alert(apiErr instanceof Error ? apiErr.message : 'No se pudo eliminar el paciente');
        return;
      }

      setUltimosPacientes(prev => 
        prev.filter((p: any) => String(p.id || p.dni || p.dni_paciente) !== String(identifier))
      );

      if (paciente && String(paciente.dni || paciente.dni_paciente) === String(identifier)) {
        setPaciente(null);
      }

      fetchDatosRecepcion();
    }
  };

  const handleEliminarConsulta = async (idOrFecha: string | number) => {
    if (confirm('¿Estás seguro de eliminar este registro de consulta?')) {
      try {
        const response = await fetch(`/api/consulta?id=${encodeURIComponent(idOrFecha)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar la consulta');
        fetchDatosRecepcion();
      } catch (err) {
        console.error('Error al eliminar consulta:', err);
        alert(err instanceof Error ? err.message : 'No se pudo eliminar la consulta');
      }
    }
  };

  const handleImprimirRecetaIndividual = (cons: any = null) => {
    setConsultaImprimir(cons || (consultas.length > 0 ? consultas[0] : null));
    setTipoImpresion('receta');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleImprimirHistorialClinico = () => {
    setTipoImpresion('historial');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ESTILOS CSS DINÁMICOS SEGÚN EL TIPO DE IMPRESIÓN */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          ${tipoImpresion === 'receta' ? `
            #print-section-receta, #print-section-receta * {
              visibility: visible !important;
            }
            #print-section-receta {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 8mm !important;
              background: white !important;
              font-size: 10px !important;
              color: black !important;
            }
          ` : `
            #print-section-historial, #print-section-historial * {
              visibility: visible !important;
            }
            #print-section-historial {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 10mm !important;
              background: white !important;
              font-size: 11px !important;
              color: black !important;
            }
          `}
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col w-full min-w-0 lg:ml-[270px] transition-all">
        
        {/* HEADER SUPERIOR */}
        <header className="h-auto min-h-[70px] py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 sticky top-0 z-20 gap-3 shadow-sm no-print">
          <div>
            <div className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">
              Módulo Clínico • Admisión General
            </div>
            <h1 className="m-0 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Admisión e Historial Clínico
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Registros Activos:</span>
              <strong className="text-teal-600 font-extrabold">{ultimosPacientes.length} Pacientes</strong>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-800 font-extrabold">Recepción Vital Salud</span>
            </div>
          </div>
        </header>

        {/* CUERPO PRINCIPAL */}
        <main className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full no-print">
          
          {/* BUSCADOR */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide mb-2">
                ⚡ Buscador de Expedientes
              </div>
              <h2 className="m-0 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Consultar Paciente por DNI
              </h2>
              <p className="m-0 text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Ingrese el DNI para ubicar al paciente, ver su estado actual y consultar su expediente completo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <form method="GET" className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    name="dni"
                    maxLength={8}
                    defaultValue={dniBuscado}
                    placeholder="Ingrese DNI (8 dígitos)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none bg-white font-semibold text-slate-900 shadow-sm"
                    required
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 fill-none stroke-slate-400 stroke-2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white border-none rounded-xl font-extrabold cursor-pointer text-xs sm:text-sm shadow-md"
                >
                  Buscar
                </button>
                {dniBuscado && (
                  <a
                    href="/recepcion"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-center font-bold text-xs border border-slate-300 no-underline"
                  >
                    ✕ Limpiar
                  </a>
                )}
              </form>
              <div className="lg:border-l lg:border-slate-200 lg:pl-3 w-full sm:w-auto">
                <NuevoPacienteModal />
              </div>
            </div>
          </div>

          {dniBuscado && !paciente && !loading && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 text-center shadow-sm">
              <div className="w-12 h-12 bg-rose-100 rounded-full text-rose-600 flex items-center justify-center mx-auto mb-3 font-extrabold text-lg">!</div>
              <h3 className="text-rose-600 m-0 text-base font-extrabold">Sin registros para el DNI: {dniBuscado}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Verifique el número ingresado o registre al paciente en el sistema.
              </p>
            </div>
          )}

          {/* TARJETA DEL PACIENTE BUSCADO */}
          {paciente && (
            <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center text-lg sm:text-xl font-black shadow-md shrink-0">
                    {paciente.nombre ? paciente.nombre.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h2 className="m-0 text-base sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                      {paciente.nombre}
                    </h2>
                    <span className="text-xs sm:text-sm text-slate-500 font-semibold">
                      Documento de Identidad: <strong className="text-slate-900">DNI {paciente.dni || paciente.dni_paciente}</strong>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleImprimirRecetaIndividual(consultas.length > 0 ? consultas[0] : null)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>🖨️</span> Imprimir Receta (1 Hoja)
                  </button>
                  <button
                    type="button"
                    onClick={handleImprimirHistorialClinico}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>🖨️</span> Imprimir Historial Clínico (Opción 3)
                  </button>
                  <BotonSeleccionarPaciente dni={paciente.dni || paciente.dni_paciente} nombre={paciente.nombre} />
                </div>
              </div>

              {/* DATOS PERSONALES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block mb-1">Teléfono</span>
                  <strong className="text-slate-900 text-xs sm:text-sm">{paciente.telefono || 'Sin teléfono'}</strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block mb-1">Edad y Género</span>
                  <strong className="text-slate-900 text-xs sm:text-sm">
                    {paciente.edad ? `${paciente.edad} años` : 'N/A'} • {paciente.genero || 'Femenino'}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block mb-1">Dirección</span>
                  <strong className="text-slate-900 text-xs sm:text-sm truncate block">{paciente.direccion || 'Sin dirección registrada'}</strong>
                </div>
              </div>

              {/* BARRA DE NAVEGACIÓN DE LAS 3 OPCIONES */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setTabActiva('resumen')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                    tabActiva === 'resumen'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  📊 Opción 1: Resumen (3 Cuadros Principales)
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('imagen')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                    tabActiva === 'imagen'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  🖼️ Opción 2: Visualizar Examen / Imagen Adjunta
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('consultas')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                    tabActiva === 'consultas'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  🩺 Historial de Consultas & Acciones
                </button>
              </div>

              {/* CONTENIDO DE LA OPCIÓN 1: LOS 3 PRIMEROS CUADROS */}
              {tabActiva === 'resumen' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-sky-800 uppercase block mb-1">
                        🩺 Consultas & Diagnóstico
                      </span>
                      {consultas.length > 0 ? (
                        <div className="text-xs text-slate-700 flex flex-col gap-1">
                          <strong className="text-slate-900">Motivo: {consultas[0].motivo || consultas[0].motivo_consulta || 'Sin motivo'}</strong>
                          <p className="m-0 text-slate-600 line-clamp-2">
                            <strong>Diagnóstico:</strong> {consultas[0].diagnostico || 'Sin diagnóstico.'}
                          </p>
                        </div>
                      ) : (
                        <p className="m-0 text-xs text-slate-400 italic">Sin consultas registradas.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-emerald-800 uppercase block mb-1">
                        💊 Receta & Dieta Vital Salud
                      </span>
                      {consultas.length > 0 && (consultas[0].receta || consultas[0].dieta) ? (
                        <div className="text-xs text-slate-700 flex flex-col gap-1">
                          {consultas[0].receta && <strong className="text-slate-900">Receta: {consultas[0].receta}</strong>}
                          {consultas[0].dieta && <p className="m-0 text-purple-900 line-clamp-2 font-medium"><strong>Dieta:</strong> {consultas[0].dieta}</p>}
                        </div>
                      ) : tratamientos.length > 0 ? (
                        <div className="text-xs text-slate-700 flex flex-col gap-1">
                          <strong className="text-slate-900">{tratamientos[0].medicamento || tratamientos[0].receta}</strong>
                        </div>
                      ) : (
                        <p className="m-0 text-xs text-slate-400 italic">Sin medicamentos ni dieta prescrita.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-700 uppercase block mb-1">
                        🏥 Estado & Triaje Reciente
                      </span>
                      {triajes.length > 0 ? (
                        <div className="text-xs text-slate-700 flex flex-col gap-1">
                          <span className="font-bold">
                            P/A: {triajes[0].presion_arterial || triajes[0].presion || '-'} | Temp: {triajes[0].temperatura ? `${triajes[0].temperatura}°C` : '-'}
                          </span>
                          <span className="text-slate-500">
                            Peso: {triajes[0].peso ? `${triajes[0].peso}kg` : '-'} | IMC: {triajes[0].imc || '-'}
                          </span>
                        </div>
                      ) : (
                        <p className="m-0 text-xs text-slate-400 italic">Sin triajes registrados.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO DE LA OPCIÓN 2: VISUALIZAR IMAGEN / EXAMEN ADJUNTO */}
              {tabActiva === 'imagen' && (
                <div className="bg-purple-50/40 p-6 rounded-2xl border border-purple-100 flex flex-col items-center justify-center gap-4 text-center">
                  <span className="text-xs font-extrabold text-purple-800 uppercase bg-purple-100 px-3 py-1 rounded-lg">
                    🧪 Examen / Imagen Clínica Adjunta
                  </span>
                  {consultas.length > 0 && consultas[0].imagen_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <img 
                        src={consultas[0].imagen_url} 
                        alt="Examen clínico" 
                        className="max-w-md w-full max-h-[400px] object-contain rounded-xl border shadow-md bg-white p-2" 
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarModalImagen(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-sm"
                      >
                        🔍 Ver Imagen en Pantalla Completa
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-6">No hay imágenes o exámenes clínicos adjuntos para este paciente.</p>
                  )}
                </div>
              )}

              {/* CONTENIDO DE LA OPCIÓN 3 / HISTORIAL DE CONSULTAS DESPLEGABLE */}
              {tabActiva === 'consultas' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="w-full px-5 py-3.5 bg-slate-100 flex justify-between items-center text-xs font-black text-slate-800 uppercase tracking-wider">
                    <span>🩺 Historial Completo de Consultas ({consultas.length})</span>
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col gap-4 bg-white">
                    {consultas.length === 0 ? (
                      <p className="m-0 text-xs text-slate-400 italic">No existen consultas registradas.</p>
                    ) : (
                      consultas.map((c: any, index: number) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="text-xs text-slate-700 flex flex-col gap-1.5 max-w-2xl">
                            <span className="text-teal-700 font-extrabold">📅 Fecha: {String(c.fecha || '').split('T')[0]} • Dr. Administrador</span>
                            <p className="m-0"><strong>Motivo:</strong> {c.motivo || c.motivo_consulta || 'Sin motivo'}</p>
                            <p className="m-0"><strong>Diagnóstico:</strong> {c.diagnostico || 'Sin diagnóstico.'}</p>
                            {c.receta && <p className="m-0 text-emerald-800"><strong>Receta:</strong> {c.receta}</p>}
                            {c.dieta && <p className="m-0 text-purple-900 font-medium"><strong>Dieta:</strong> {c.dieta}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleImprimirRecetaIndividual(c)}
                              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-sm"
                            >
                              🖨️ Imprimir Receta
                            </button>
                            {(c.id !== undefined || c.fecha !== undefined) && (
                              <button
                                type="button"
                                onClick={() => handleEliminarConsulta(c.id || c.fecha)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-extrabold text-xs cursor-pointer"
                              >
                                🗑️ Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABLA PADRÓN ACTIVO */}
          {!dniBuscado && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-7 shadow-sm">
              <div className="mb-5">
                <div className="text-[11px] font-extrabold text-teal-600 uppercase tracking-wider">
                  Padrón Activo
                </div>
                <h3 className="m-0 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Pacientes Registrados Recientemente
                </h3>
              </div>
              {ultimosPacientes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                  No existen pacientes registrados actualmente en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-separate border-spacing-y-2 text-xs sm:text-sm text-left min-w-[700px]">
                    <thead>
                      <tr className="text-slate-400 font-extrabold text-[11px] tracking-wider uppercase">
                        <th className="px-4 py-3">PACIENTE</th>
                        <th className="px-4 py-3">DNI</th>
                        <th className="px-4 py-3">TELÉFONO</th>
                        <th className="px-4 py-3">DIRECCIÓN</th>
                        <th className="px-4 py-3 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosPacientes.map((p: any) => (
                        <tr key={p.id || p.dni || p.dni_paciente} className="bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                          <td className="px-4 py-3 font-bold text-slate-900 rounded-l-xl border-l-4 border-teal-600 border-t border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-teal-600 border border-emerald-200 flex items-center justify-center font-extrabold text-sm shrink-0">
                                {p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <a 
                                href={`/recepcion?dni=${p.dni || p.dni_paciente}`} 
                                className="whitespace-nowrap font-bold text-xs sm:text-sm text-slate-900 hover:text-sky-600 no-underline"
                              >
                                {p.nombre}
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-bold border-t border-b border-slate-200">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono text-xs">{p.dni || p.dni_paciente}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold border-t border-b border-slate-200 whitespace-nowrap">
                            {p.telefono || 'Sin teléfono'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold border-t border-b border-slate-200 max-w-[180px] truncate">
                            {p.direccion || 'Sin dirección'}
                          </td>
                          <td className="px-4 py-3 text-right rounded-r-xl border-r border-t border-b border-slate-200">
                            <div className="flex items-center justify-end gap-2">
                              <BotonSeleccionarPaciente dni={p.dni || p.dni_paciente} nombre={p.nombre} />
                              <a
                                href={`/recepcion?dni=${p.dni || p.dni_paciente}`}
                                className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl font-extrabold text-xs no-underline transition-all inline-flex items-center gap-1"
                                title="Ver expediente completo"
                              >
                                <span>📄</span> Ver Expediente
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEliminarPaciente(p)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all"
                                title="Eliminar Paciente"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MODAL PARA VER IMAGEN EN PANTALLA COMPLETA */}
      {mostrarModalImagen && consultas.length > 0 && consultas[0].imagen_url && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-700">
            <div className="bg-slate-800 px-6 py-3 flex justify-between items-center">
              <h3 className="m-0 text-sm font-black">Visualización de Imagen / Examen Adjunto</h3>
              <button onClick={() => setMostrarModalImagen(false)} className="bg-rose-600 hover:bg-rose-700 text-white w-7 h-7 rounded-lg font-black text-xs cursor-pointer">✕</button>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/50 overflow-auto flex-1">
              <img src={consultas[0].imagen_url} alt="Examen Completo" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DE IMPRESIÓN 1: RECETA INDIVIDUAL */}
      {paciente && (
        <div id="print-section-receta" className="hidden print:block bg-white text-slate-900 font-sans">
          <div className="text-center border-b-2 border-teal-700 pb-2 mb-2">
            <h1 className="text-sm font-black text-teal-700 m-0 uppercase tracking-wider">
              CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC
            </h1>
            <p className="text-[9px] font-bold text-slate-600 m-0 uppercase">
              Receta Médica y Plan Nutricional Especializado • Fecha: {consultaImprimir ? String(consultaImprimir.fecha || '').split('T')[0] : new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="mb-2 text-[10px] flex justify-between border-b border-slate-200 pb-1">
            <div>
              <strong>Paciente:</strong> {paciente.nombre}
            </div>
            <div>
              <strong>DNI:</strong> {paciente.dni || paciente.dni_paciente} &nbsp;|&nbsp; 
              <strong>Edad:</strong> {paciente.edad ? `${paciente.edad} años` : 'N/A'}
            </div>
          </div>
          <div className="mb-2 text-[10px]">
            <strong className="text-teal-800 uppercase">Diagnóstico Clínico:</strong>
            <p className="m-0 text-slate-800">{consultaImprimir?.diagnostico || 'Sin diagnóstico registrado.'}</p>
          </div>
          <div className="mb-2 text-[10px]">
            <strong className="text-teal-800 uppercase">Prescripción / Receta Médica:</strong>
            <p className="m-0 text-slate-800">{consultaImprimir?.receta || 'Sin receta registrada.'}</p>
          </div>
          <div className="mb-2 text-[9px] leading-tight whitespace-pre-wrap font-sans text-slate-900">
            {consultaImprimir?.dieta || 'Sin dieta institucional registrada.'}
          </div>
          <div className="mt-8 pt-2 text-center flex flex-col items-center">
            <div className="w-44 border-t border-slate-900 pt-1">
              <p className="font-bold text-[10px] m-0 text-slate-900">Dr. Administrador</p>
              <p className="text-[8.5px] text-slate-600 m-0">Especialista Vital Salud</p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DE IMPRESIÓN 3: HISTORIAL CLÍNICO UNIFICADO */}
      {paciente && (
        <div id="print-section-historial" className="hidden print:block bg-white text-slate-900 font-sans p-4">
          <div className="text-center border-b-2 border-teal-700 pb-2 mb-4">
            <h1 className="text-base font-black text-teal-700 m-0 uppercase tracking-wider">
              CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC
            </h1>
            <p className="text-[10px] font-bold text-slate-600 m-0 uppercase">
              Historial Clínico Unificado • Fecha: {new Date().toLocaleDateString('es-PE')}
            </p>
          </div>
          <div className="mb-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs">
            <h3 className="text-xs font-black text-teal-800 uppercase border-b border-slate-300 pb-1 mb-2">Datos del Paciente</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="m-0"><strong>Paciente:</strong> {paciente.nombre}</p>
              <p className="m-0"><strong>DNI:</strong> {paciente.dni || paciente.dni_paciente}</p>
              <p className="m-0"><strong>Teléfono:</strong> {paciente.telefono || 'Sin teléfono'}</p>
              <p className="m-0"><strong>Dirección:</strong> {paciente.direccion || 'Sin dirección'}</p>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-xs font-black text-teal-800 uppercase border-b border-teal-800 pb-1 mb-2">
              Historial de Consultas & Diagnósticos ({consultas.length})
            </h3>
            {consultas.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">No se registran consultas previas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {consultas.map((c: any, i: number) => (
                  <div key={i} className="p-2 border border-slate-300 rounded text-[10px] bg-slate-50">
                    <p className="m-0 font-bold text-teal-700">📅 {String(c.fecha || '').split('T')[0]} - Dr. Administrador</p>
                    <p className="m-0"><strong>Motivo:</strong> {c.motivo || 'N/A'}</p>
                    <p className="m-0"><strong>Diagnóstico:</strong> {c.diagnostico || 'N/A'}</p>
                    {c.dieta && <p className="m-0 mt-1 whitespace-pre-wrap"><strong>Dieta / Cápsulas:</strong> {c.dieta}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="text-xs font-black text-teal-800 uppercase border-b border-teal-800 pb-1 mb-2">
              Historial de Triaje y Signos Vitales
            </h3>
            {triajes.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">No se registran triajes previos.</p>
            ) : (
              <table className="w-full text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-200 text-slate-900">
                    <th className="border border-slate-400 p-1">Fecha</th>
                    <th className="border border-slate-400 p-1">Temp</th>
                    <th className="border border-slate-400 p-1">P/A</th>
                    <th className="border border-slate-400 p-1">Peso</th>
                    <th className="border border-slate-400 p-1">Talla</th>
                    <th className="border border-slate-400 p-1">IMC</th>
                    <th className="border border-slate-400 p-1">Pulso</th>
                    <th className="border border-slate-400 p-1">SO2</th>
                  </tr>
                </thead>
                <tbody>
                  {triajes.map((tr: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-slate-400 p-1 font-bold">{tr.fecha || '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.temperatura ? `${tr.temperatura}°C` : '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.presion_arterial || tr.presion || '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.peso ? `${tr.peso}kg` : '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.talla ? `${tr.talla}cm` : '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.imc || '-'}</td>
                      <td className="border border-slate-400 p-1">{tr.pulso || tr.frecuencia_cardiaca || '-'} bpm</td>
                      <td className="border border-slate-400 p-1">{tr.so2 ? `${tr.so2}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-8 pt-2 text-center flex flex-col items-center">
            <div className="w-44 border-t border-slate-900 pt-1">
              <p className="font-bold text-[10px] m-0 text-slate-900">Dr. Administrador</p>
              <p className="text-[8.5px] text-slate-600 m-0">Especialista Vital Salud</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecepcionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando...</div>}>
      <RecepcionPageContent />
    </Suspense>
  );
}

