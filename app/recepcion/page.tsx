'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NuevoPacienteModal from '@/components/NuevoPacienteModal';
import BotonSeleccionarPaciente from '@/components/BotonSeleccionarPaciente';
import MuestraTriaje from '@/components/MuestraTriaje';
import { primerApellido } from '@/lib/busqueda-pacientes';
import { agruparSesiones } from '@/lib/vitaminas-sesiones';

type EdicionPaciente = {
  dni: string;
  nombre: string;
  telefono: string;
  edad: string;
  genero: string;
  direccion: string;
};

type PacienteRecepcion = Partial<EdicionPaciente> & {
  id?: string | number;
  dni: string;
  nombre: string;
  dni_paciente?: string;
  nombre_paciente?: string;
};
type AdjuntoConsulta = { id: number; nombre: string; tipo: string; fecha: string; consulta_id: number };

const normalizarBusqueda = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function RecepcionPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const vistaSolicitada = searchParams.get('vista');
  const busquedaParam = searchParams.get('buscar')?.trim() || '';
  const dniBuscado = dniParam ? dniParam.replace(/\D/g, '').trim() : /^\d{8}$/.test(busquedaParam) ? busquedaParam : '';
  const [paciente, setPaciente] = useState<any>(null);
  const [triajes, setTriajes] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [adjuntosConsultas, setAdjuntosConsultas] = useState<AdjuntoConsulta[]>([]);
  const [adjuntoVisible, setAdjuntoVisible] = useState<{ url: string; tipo: string; nombre: string } | null>(null);
  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [errorVitaminas, setErrorVitaminas] = useState('');
  const [pacientesRegistrados, setPacientesRegistrados] = useState<PacienteRecepcion[]>([]);
  const [filtroPacientes, setFiltroPacientes] = useState<string | null>(null);
  const [paginaPacientes, setPaginaPacientes] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [edicionPaciente, setEdicionPaciente] = useState<EdicionPaciente | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState('');
  
  // Estados para modales y navegación por pestañas en la tarjeta del paciente
  const [mostrarModalReceta, setMostrarModalReceta] = useState<boolean>(false);
  const [mostrarModalImagen, setMostrarModalImagen] = useState<boolean>(false);
  const [consultaImprimir, setConsultaImprimir] = useState<any>(null);
  const [tipoImpresion, setTipoImpresion] = useState<'receta' | 'historial'>('receta');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'imagen' | 'consultas' | 'vitaminas' | 'triaje'>(vistaSolicitada === 'vitaminas' || vistaSolicitada === 'triaje' ? vistaSolicitada : 'resumen');
  const [consultasDesplegadas, setConsultasDesplegadas] = useState<boolean>(true);

  useEffect(() => {
    fetchDatosRecepcion();
  }, [dniBuscado]);

  const fetchDatosRecepcion = async () => {
    try {
      setLoading(true);
      setTratamientos([]);
      setAdjuntosConsultas([]);
      setErrorVitaminas('');
      
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

      setPacientesRegistrados([...dataTodos].sort((a, b) => {
        const nombreA = String(a.nombre || a.nombre_paciente || '');
        const nombreB = String(b.nombre || b.nombre_paciente || '');
        return primerApellido(nombreA).localeCompare(primerApellido(nombreB), 'es-PE', { sensitivity: 'base' }) ||
          nombreA.localeCompare(nombreB, 'es-PE', { sensitivity: 'base' });
      }));

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
              const listas = await Promise.all(consData.map(async (item: { id: number }) => {
                try {
                  const respuesta = await fetch(`/api/consulta/adjuntos?id=${item.id}`, { cache: 'no-store' });
                  if (!respuesta.ok) return [];
                  const adjuntos: Omit<AdjuntoConsulta, 'consulta_id'>[] = await respuesta.json();
                  return adjuntos.map(adjunto => ({ ...adjunto, consulta_id: item.id }));
                } catch { return []; }
              }));
              const todosAdjuntos = listas.flat();
              setAdjuntosConsultas(todosAdjuntos);
              const primeraImagen = todosAdjuntos.find(item => item.tipo.startsWith('image/'));
              if (primeraImagen && consData.length > 0 && !consData[0].imagen_url) consData[0].imagen_url = `/api/consulta/adjuntos/${primeraImagen.id}`;
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
            if (!resRecetas.ok) throw new Error('No se pudo cargar el historial de vitaminas.');
            setTratamientos(await resRecetas.json());
          } catch (e) { setErrorVitaminas(e instanceof Error ? e.message : 'No se pudo cargar el historial de vitaminas.'); }

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

      setPacientesRegistrados(prev => 
        prev.filter((p) => String(p.id || p.dni || p.dni_paciente) !== String(identifier))
      );

      if (paciente && String(paciente.dni || paciente.dni_paciente) === String(identifier)) {
        setPaciente(null);
      }

      fetchDatosRecepcion();
    }
  };

  const iniciarEdicionPaciente = (registro: PacienteRecepcion) => {
    setErrorEdicion('');
    setEdicionPaciente({
      dni: String(registro.dni || registro.dni_paciente || ''),
      nombre: String(registro.nombre || registro.nombre_paciente || ''),
      telefono: String(registro.telefono || ''),
      edad: registro.edad === null || registro.edad === undefined ? '' : String(registro.edad),
      genero: String(registro.genero || ''),
      direccion: String(registro.direccion || ''),
    });
  };

  const actualizarEdicionPaciente = (campo: keyof EdicionPaciente, valor: string) => {
    setEdicionPaciente(prev => prev ? { ...prev, [campo]: valor } : null);
  };

  const guardarEdicionPaciente = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edicionPaciente) return;
    setGuardandoEdicion(true);
    setErrorEdicion('');
    try {
      const res = await fetch('/api/pacientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edicionPaciente),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el paciente');
      const activo = localStorage.getItem('paciente_activo_vital_salud');
      if (activo) {
        try {
          const seleccionado = JSON.parse(activo);
          if (seleccionado.dni === edicionPaciente.dni) localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({ ...seleccionado, nombre: edicionPaciente.nombre }));
        } catch { /* Se actualizará desde la base de datos en la siguiente carga. */ }
      }
      window.dispatchEvent(new Event('paciente_activo_changed'));
      setEdicionPaciente(null);
      await fetchDatosRecepcion();
    } catch (error) {
      setErrorEdicion(error instanceof Error ? error.message : 'No se pudo actualizar el paciente');
    } finally {
      setGuardandoEdicion(false);
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

  const filtroNormalizado = normalizarBusqueda((filtroPacientes ?? busquedaParam).trim());
  const pacientesVisibles = pacientesRegistrados.filter((p) => {
    const nombre = String(p.nombre || p.nombre_paciente || '');
    if (/^[a-z]$/.test(filtroNormalizado)) {
      return normalizarBusqueda(primerApellido(nombre)).startsWith(filtroNormalizado);
    }
    return normalizarBusqueda(nombre).includes(filtroNormalizado) ||
      String(p.dni || p.dni_paciente || '').includes(filtroNormalizado);
  });
  const paginasPacientes = Math.max(1, Math.ceil(pacientesVisibles.length / 6));
  const paginaVisible = Math.min(paginaPacientes, paginasPacientes);
  const pacientesPagina = pacientesVisibles.slice((paginaVisible - 1) * 6, paginaVisible * 6);
  const sesionesVitaminas = agruparSesiones(tratamientos.map((item: Record<string, unknown>) => ({
    id: Number(item.id),
    vitaminaNombre: String(item.vitaminaNombre ?? item.vitaminanombre ?? item.medicamento ?? 'Vitamina o suero'),
    dosis: String(item.dosis ?? ''),
    via: String(item.via ?? ''),
    observaciones: String(item.observaciones ?? ''),
    fechaAplicacion: String(item.fechaAplicacion ?? item.fechaaplicacion ?? item.fecha_aplicacion ?? '')
  })).filter(item => Number.isSafeInteger(item.id) && item.id > 0));

  return (
    <div className="module-shell flex min-h-screen bg-slate-50 font-sans text-slate-900">
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

      <div className="module-content flex-1 flex flex-col w-full min-w-0 lg:ml-[270px] transition-all">
        
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
              <strong className="text-teal-600 font-extrabold">{pacientesRegistrados.length} Pacientes</strong>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-800 font-extrabold">Recepción Vital Salud</span>
            </div>
          </div>
        </header>

        {/* CUERPO PRINCIPAL */}
        <main className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full no-print">
          
          {/* DIRECTORIO DE PACIENTES, VISIBLE AL ENTRAR */}
          {!dniBuscado && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-7 shadow-sm">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                <div className="text-[11px] font-extrabold text-teal-600 uppercase tracking-wider">
                  Padrón Activo
                </div>
                <h3 className="m-0 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Pacientes registrados ({pacientesRegistrados.length}) · por apellido A-Z
                </h3>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><input type="search" value={filtroPacientes ?? busquedaParam} onChange={e => { setFiltroPacientes(e.target.value); setPaginaPacientes(1); }} placeholder="Buscar nombre, apellido o DNI" aria-label="Buscar pacientes registrados" className="min-w-0 flex-1 sm:w-72 px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-teal-600" /><NuevoPacienteModal /></div>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900"><span className="font-bold">Mostrando {pacientesVisibles.length ? (paginaVisible - 1) * 6 + 1 : 0}–{Math.min(paginaVisible * 6, pacientesVisibles.length)} de {pacientesVisibles.length} pacientes</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPaginaPacientes(prev => Math.max(1, prev - 1))} disabled={paginaVisible <= 1} className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 font-bold text-sky-800 disabled:opacity-40">Anterior</button><span className="min-w-16 text-center font-bold">{paginaVisible} / {paginasPacientes}</span><button type="button" onClick={() => setPaginaPacientes(prev => Math.min(paginasPacientes, prev + 1))} disabled={paginaVisible >= paginasPacientes} className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 font-bold text-sky-800 disabled:opacity-40">Siguiente</button></div></div>
              {loading ? (
                <div role="status" className="py-10 text-center text-sm text-slate-600">Cargando pacientes...</div>
              ) : pacientesRegistrados.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                  No existen pacientes registrados actualmente en el sistema.
                </div>
              ) : pacientesVisibles.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
                  No hay pacientes que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pacientesPagina.map((p) => <article key={p.id || p.dni || p.dni_paciente} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-extrabold shrink-0">{p.nombre?.charAt(0).toUpperCase() || 'P'}</div>
                      <div className="min-w-0"><a href={`/recepcion?dni=${p.dni || p.dni_paciente}`} className="font-extrabold text-slate-900 hover:text-sky-700 no-underline break-words">{p.nombre}</a><p className="text-xs text-slate-500 m-0">DNI {p.dni || p.dni_paciente}</p></div>
                    </div>
                    <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600"><span>☎ {p.telefono || 'Sin teléfono'}</span><span className="break-words">⌖ {p.direccion || 'Sin dirección'}</span></div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                      <BotonSeleccionarPaciente dni={p.dni || p.dni_paciente || ''} nombre={p.nombre} />
                      <a href={`/recepcion?dni=${p.dni || p.dni_paciente}`} className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl font-extrabold text-xs no-underline">📄 Expediente</a>
                      <a href={`/enfermeria?dni=${p.dni || p.dni_paciente}`} className="px-3 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl font-extrabold text-xs no-underline">🩺 Triaje</a>
                      <button type="button" onClick={() => iniciarEdicionPaciente(p)} className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-extrabold text-xs">✏️ Editar</button>
                      <a href={`/recepcion?dni=${encodeURIComponent(p.dni || p.dni_paciente || '')}&vista=vitaminas`} className="px-3 py-2 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl font-extrabold text-xs no-underline">💉 Muestra de vitaminas</a>
                      <a href={`/recepcion?dni=${encodeURIComponent(p.dni || p.dni_paciente || '')}&vista=triaje`} className="px-3 py-2 bg-violet-50 text-violet-800 border border-violet-200 rounded-xl font-extrabold text-xs no-underline">🩺 Muestra de triaje</a>
                      <button type="button" onClick={() => handleEliminarPaciente(p)} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-extrabold text-xs" aria-label={`Eliminar ${p.nombre}`}>🗑️</button>
                    </div>
                  </article>)}
                </div>
              )}
            </div>
          )}

          {/* BUSCADOR */}
          {dniBuscado && <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide mb-2">
                ⚡ Buscador de Expedientes
              </div>
              <h2 className="m-0 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Buscar pacientes por apellido o DNI
              </h2>
              <p className="m-0 text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Escriba la primera letra del apellido para ver pacientes en orden alfabético, o ingrese el DNI para abrir su expediente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <form method="GET" action="/recepcion" onSubmit={() => setFiltroPacientes(null)} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    name="buscar"
                    key={busquedaParam || dniBuscado}
                    defaultValue={busquedaParam || dniBuscado}
                    placeholder="Inicial del apellido o DNI..."
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
                {(dniBuscado || busquedaParam) && (
                  <a
                    href="/recepcion"
                    onClick={() => setFiltroPacientes(null)}
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
          </div>}

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
                    onClick={() => iniciarEdicionPaciente(paciente)}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-extrabold text-xs cursor-pointer"
                  >
                    ✏️ Editar paciente
                  </button>
                  <a href={`/recepcion?dni=${encodeURIComponent(paciente.dni || paciente.dni_paciente)}&vista=vitaminas`} className="px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 font-extrabold text-xs no-underline">💉 Muestra de vitaminas</a>
                  <a href={`/recepcion?dni=${encodeURIComponent(paciente.dni || paciente.dni_paciente)}&vista=triaje`} className="px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 font-extrabold text-xs no-underline">🩺 Muestra de triaje</a>
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
                  <a href={`/enfermeria?dni=${encodeURIComponent(paciente.dni || paciente.dni_paciente)}`} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs no-underline">🩺 Ir a Triaje</a>
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
                <button type="button" onClick={() => setTabActiva('vitaminas')} className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${tabActiva === 'vitaminas' ? 'bg-sky-700 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>💉 Muestra de vitaminas</button>
                <button type="button" onClick={() => setTabActiva('triaje')} className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${tabActiva === 'triaje' ? 'bg-violet-700 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>🩺 Muestra de triaje</button>
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
                  {adjuntosConsultas.length > 0 || consultas.some(c => c.imagen_url) ? (
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 text-left">
                      {adjuntosConsultas.map(adjunto => <button key={adjunto.id} type="button" onClick={() => setAdjuntoVisible({ url: `/api/consulta/adjuntos/${adjunto.id}`, tipo: adjunto.tipo, nombre: adjunto.nombre })} className="rounded-xl border border-purple-200 bg-white p-3 text-left hover:bg-purple-50">
                        {adjunto.tipo.startsWith('image/') ? <img src={`/api/consulta/adjuntos/${adjunto.id}`} alt={adjunto.nombre} className="h-32 w-full rounded-lg object-contain bg-slate-50" /> : <div className="h-32 flex items-center justify-center text-4xl">📄</div>}
                        <strong className="block mt-2 truncate text-xs text-slate-900">{adjunto.nombre}</strong><span className="text-[11px] text-slate-500">{new Date(adjunto.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })}</span>
                      </button>)}
                      {consultas.filter(c => c.imagen_url && !adjuntosConsultas.some(a => `/api/consulta/adjuntos/${a.id}` === c.imagen_url)).map(c => <button key={`antigua-${c.id}`} type="button" onClick={() => setAdjuntoVisible({ url: c.imagen_url, tipo: 'image/jpeg', nombre: 'Imagen clínica anterior' })} className="rounded-xl border border-purple-200 bg-white p-3 text-left"><img src={c.imagen_url} alt="Imagen clínica anterior" className="h-32 w-full object-contain" /></button>)}
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
                            <span className="text-teal-700 font-extrabold">📅 Fecha y hora: {c.fecha && !Number.isNaN(new Date(c.fecha).getTime()) ? new Date(c.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }) : c.fecha} • Dr. Administrador</span>
                            <p className="m-0"><strong>Motivo:</strong> {c.motivo || c.motivo_consulta || 'Sin motivo'}</p>
                            <p className="m-0"><strong>Diagnóstico:</strong> {c.diagnostico || 'Sin diagnóstico.'}</p>
                            {c.receta && <p className="m-0 text-emerald-800"><strong>Receta:</strong> {c.receta}</p>}
                            {c.dieta && <p className="m-0 text-purple-900 font-medium whitespace-pre-wrap"><strong>Dieta:</strong> {c.dieta}</p>}
                            {adjuntosConsultas.filter(a => a.consulta_id === c.id).map(a => <button key={a.id} type="button" onClick={() => setAdjuntoVisible({ url: `/api/consulta/adjuntos/${a.id}`, tipo: a.tipo, nombre: a.nombre })} className="w-fit text-left text-sky-800 underline">{a.tipo.startsWith('image/') ? '🖼️' : '📄'} {a.nombre} · {new Date(a.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })}</button>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => window.open(`/api/consulta/pdf?id=${c.id}`, '_blank', 'noopener,noreferrer')} className="px-3 py-2 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl font-extrabold text-xs">📄 Ver ficha PDF</button>
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
              {tabActiva === 'vitaminas' && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 sm:p-6" aria-label="Muestra de vitaminas del paciente">
                  <h3 className="m-0 text-lg font-extrabold text-sky-900">Vitaminas y sueros aplicados</h3>
                  <p className="m-0 mt-1 text-xs text-slate-600">{paciente.nombre} · DNI {paciente.dni || paciente.dni_paciente} · Una tarjeta por fecha de aplicación</p>
                  {errorVitaminas ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700">{errorVitaminas}</p> : sesionesVitaminas.length === 0 ? <p className="mt-4 rounded-xl border border-sky-200 bg-white p-4 text-sm text-slate-600">Este paciente aún no tiene vitaminas o sueros registrados.</p> : <div className="mt-4 grid gap-4 md:grid-cols-2">{sesionesVitaminas.map(([dia, aplicaciones]) => <article key={dia} className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2"><strong className="text-sm text-sky-900">Fecha: {dia.startsWith('registro-') ? 'Sin fecha' : dia.split('-').reverse().join('/')}</strong><span className="text-xs font-semibold text-slate-600">{aplicaciones.length} {aplicaciones.length === 1 ? 'producto' : 'productos'}</span></div><div className="mt-3 space-y-3">{aplicaciones.map(item => <div key={item.id} className="border-t border-sky-100 pt-3 first:border-t-0 first:pt-0 text-xs text-slate-700"><strong className="block text-sm text-slate-900">{item.vitaminaNombre}</strong><span className="block mt-1">Dosis: {item.dosis || 'Sin dato'} · Vía: {item.via || 'Sin dato'}</span>{item.fechaAplicacion && !Number.isNaN(new Date(item.fechaAplicacion).getTime()) && <span className="block mt-1">Hora: {new Date(item.fechaAplicacion).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })}</span>}{item.observaciones && <p className="m-0 mt-1 whitespace-pre-wrap">{item.observaciones}</p>}</div>)}</div></article>)}</div>}
                </section>
              )}
              {tabActiva === 'triaje' && <MuestraTriaje key={paciente.dni || paciente.dni_paciente} dni={paciente.dni || paciente.dni_paciente} />}
            </div>
          )}

        </main>
      </div>

      {edicionPaciente && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 no-print" role="dialog" aria-modal="true" aria-label="Editar paciente">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="m-0 text-lg font-extrabold text-slate-900">Editar paciente</h2>
              <button type="button" onClick={() => setEdicionPaciente(null)} disabled={guardandoEdicion} aria-label="Cerrar edición" className="text-slate-500 hover:text-slate-900 text-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={guardarEdicionPaciente} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold text-slate-700">
                DNI
                <input value={edicionPaciente.dni} readOnly className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-700" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Edad
                <input type="number" min="0" max="130" value={edicionPaciente.edad} onChange={(e) => actualizarEdicionPaciente('edad', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </label>
              <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
                Nombre completo *
                <input required maxLength={200} value={edicionPaciente.nombre} onChange={(e) => actualizarEdicionPaciente('nombre', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Teléfono
                <input maxLength={30} value={edicionPaciente.telefono} onChange={(e) => actualizarEdicionPaciente('telefono', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Género
                <select value={edicionPaciente.genero} onChange={(e) => actualizarEdicionPaciente('genero', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900">
                  <option value="">Seleccionar</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
                Dirección
                <input maxLength={255} value={edicionPaciente.direccion} onChange={(e) => actualizarEdicionPaciente('direccion', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-slate-900" />
              </label>
              {errorEdicion && <p role="alert" className="m-0 text-sm text-rose-700 sm:col-span-2">{errorEdicion}</p>}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setEdicionPaciente(null)} disabled={guardandoEdicion} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Cancelar</button>
                <button type="submit" disabled={guardandoEdicion} className="px-4 py-2.5 rounded-xl bg-teal-700 text-white font-bold cursor-pointer disabled:opacity-50">{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      {adjuntoVisible && <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 p-4" role="dialog" aria-modal="true" aria-label="Visor de adjunto clínico"><div className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-t-xl bg-white p-3"><strong className="truncate text-sm text-slate-900">{adjuntoVisible.nombre}</strong><button type="button" onClick={() => setAdjuntoVisible(null)} className="rounded-lg bg-slate-900 px-3 py-2 text-white font-bold">✕ Regresar</button></div>{adjuntoVisible.tipo === 'application/pdf' ? <iframe src={adjuntoVisible.url} title={adjuntoVisible.nombre} className="mx-auto w-full max-w-5xl flex-1 bg-white" /> : <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center overflow-auto bg-slate-950"><img src={adjuntoVisible.url} alt={adjuntoVisible.nombre} className="max-h-[80vh] max-w-full object-contain" /></div>}</div>}

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

