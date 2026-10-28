'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Internado {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  cama: string;
  fecha_ingreso: string;
  tiempo_estancia_num?: string | number;
  tiempo_estancia_unidad?: 'dias' | 'semanas' | 'meses';
  fecha_estimada_salida?: string;
  diagnostico?: string;
  observaciones?: string;
  estado: 'hospitalizado' | 'alta';
  fecha_salida?: string;
  hora_salida?: string;
  motivo_salida?: string;
  notas_salida?: string;
}

function InternadosPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');

  const [internados, setInternados] = useState<Internado[]>([]);
  const [pacientesRegistrados, setPacientesRegistrados] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [buscandoDni, setBuscandoDni] = useState<boolean>(false);
  const [mensajeDni, setMensajeDni] = useState<{ texto: string; tipo: 'exito' | 'nuevo' } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [filtro, setFiltro] = useState<string>('');
  
  // Pestaña activa del formulario (Ingreso o Salida)
  const [tipoFormulario, setTipoFormulario] = useState<'ingreso' | 'salida'>('ingreso');
  
  // Formulario para Ingreso
  const [formIngreso, setFormIngreso] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    cama: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    tiempo_estancia_num: '1',
    tiempo_estancia_unidad: 'dias',
    fecha_estimada_salida: '',
    diagnostico: '',
    observaciones: ''
  });

  // Formulario para Registrar Salida
  const [pacienteSalidaId, setPacienteSalidaId] = useState<string | number>('');
  const [formSalida, setFormSalida] = useState({
    fecha_salida: new Date().toISOString().split('T')[0],
    hora_salida: '',
    motivo_salida: '',
    notas_salida: ''
  });

  useEffect(() => {
    fetchInternados();
    fetchBasePacientes();
  }, []);

  // Sincronización automática del paciente activo desde URL o localStorage
  useEffect(() => {
    let dniTarget = dniParam;
    if (!dniTarget) {
      const guardado = localStorage.getItem('paciente_activo_vital_salud');
      if (guardado) {
        try {
          const parsed = JSON.parse(guardado);
          if (parsed && parsed.dni) {
            dniTarget = parsed.dni;
          }
        } catch (e) {
          console.error('Error leyendo paciente activo:', e);
        }
      }
    }
    if (dniTarget) {
      buscarPacientePorDni(dniTarget);
    }
  }, [dniParam, pacientesRegistrados]);

  // Recalcular la fecha estimada de salida cuando cambia fecha de ingreso, número o unidad
  useEffect(() => {
    if (formIngreso.fecha_ingreso && formIngreso.tiempo_estancia_num) {
      const num = parseInt(formIngreso.tiempo_estancia_num, 10);
      if (!isNaN(num) && num > 0) {
        const fecha = new Date(formIngreso.fecha_ingreso + 'T00:00:00');
        if (formIngreso.tiempo_estancia_unidad === 'dias') {
          fecha.setDate(fecha.getDate() + num);
        } else if (formIngreso.tiempo_estancia_unidad === 'semanas') {
          fecha.setDate(fecha.getDate() + (num * 7));
        } else if (formIngreso.tiempo_estancia_unidad === 'meses') {
          fecha.setMonth(fecha.getMonth() + num);
        }
        setFormIngreso(prev => ({
          ...prev,
          fecha_estimada_salida: fecha.toISOString().split('T')[0]
        }));
      }
    }
  }, [formIngreso.fecha_ingreso, formIngreso.tiempo_estancia_num, formIngreso.tiempo_estancia_unidad]);

  const fetchInternados = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/internados');
      if (res.ok) {
        const data = await res.json();
        setInternados(data);
      }
    } catch (err) {
      console.error('Error cargando internados:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBasePacientes = async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) {
        const data = await res.json();
        setPacientesRegistrados(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando base de pacientes:', err);
    }
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dni = e.target.value;
    setFormIngreso(prev => ({ ...prev, dni_paciente: dni }));
    if (dni.length >= 8) {
      buscarPacientePorDni(dni);
    } else {
      setMensajeDni(null);
    }
  };

  const buscarPacientePorDni = async (dni: string) => {
    if (!dni) return;
    setBuscandoDni(true);
    try {
      const encontrado = pacientesRegistrados.find(p => p.dni_paciente === dni || p.dni === dni);
      if (encontrado) {
        const nombreVal = encontrado.nombre_paciente || encontrado.nombre || formIngreso.nombre_paciente;
        const dniVal = encontrado.dni_paciente || encontrado.dni || dni;

        setFormIngreso(prev => ({
          ...prev,
          dni_paciente: dniVal,
          nombre_paciente: nombreVal
        }));

        setMensajeDni({
          texto: '✅ Paciente registrado encontrado. Datos autorrellenados.',
          tipo: 'exito'
        });

        // Sincronizar paciente activo
        localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
          dni: dniVal,
          nombre: nombreVal
        }));
        window.dispatchEvent(new Event('paciente_activo_changed'));
      } else {
        const res = await fetch(`/api/pacientes?dni=${dni}`);
        if (res.ok) {
          const data = await res.json();
          const paciente = Array.isArray(data) ? data[0] : data;
          if (paciente && (paciente.nombre_paciente || paciente.nombre)) {
            const nombreVal = paciente.nombre_paciente || paciente.nombre;
            setFormIngreso(prev => ({
              ...prev,
              dni_paciente: dni,
              nombre_paciente: nombreVal
            }));
            setMensajeDni({
              texto: '✅ Paciente registrado encontrado. Datos autorrellenados.',
              tipo: 'exito'
            });

            localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
              dni: dni,
              nombre: nombreVal
            }));
            window.dispatchEvent(new Event('paciente_activo_changed'));
            return;
          }
        }
        setMensajeDni({
          texto: 'ℹ️ Paciente nuevo. Por favor ingrese su nombre.',
          tipo: 'nuevo'
        });
      }
    } catch (err) {
      console.error('Error buscando DNI:', err);
    } finally {
      setBuscandoDni(false);
    }
  };

  const handleSelectPacienteLista = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dniElegido = e.target.value;
    if (!dniElegido) {
      setFormIngreso(prev => ({ ...prev, dni_paciente: '', nombre_paciente: '' }));
      setMensajeDni(null);
      return;
    }
    const paciente = pacientesRegistrados.find(p => (p.dni === dniElegido || p.dni_paciente === dniElegido));
    if (paciente) {
      const nombreVal = paciente.nombre || paciente.nombre_paciente || '';
      const dniVal = paciente.dni || paciente.dni_paciente || '';

      setFormIngreso(prev => ({
        ...prev,
        dni_paciente: dniVal,
        nombre_paciente: nombreVal
      }));
      setMensajeDni({
        texto: '✅ Paciente seleccionado. Datos autorrellenados.',
        tipo: 'exito'
      });

      localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
        dni: dniVal,
        nombre: nombreVal
      }));
      window.dispatchEvent(new Event('paciente_activo_changed'));
    }
  };

  const handleEliminarInternado = async (id: string | number) => {
    if (confirm('⚠️ ¿Estás seguro de eliminar este registro de internamiento/prueba?')) {
      try {
        const response = await fetch(`/api/internados?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar el internamiento');
        setInternados(prev => prev.filter(item => item.id !== id));
        if (String(pacienteSalidaId) === String(id)) {
          setPacienteSalidaId('');
        }
      } catch (err) {
        console.error('Error al eliminar el internado:', err);
        alert(err instanceof Error ? err.message : 'No se pudo eliminar el internamiento');
      }
    }
  };

  const handleChangeIngreso = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormIngreso(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeSalida = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormSalida(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIngreso.dni_paciente || !formIngreso.nombre_paciente || !formIngreso.cama) {
      alert('Por favor completa los campos obligatorios (*)');
      return;
    }
    try {
      setSaving(true);
      const nuevoInternado = {
        id: Date.now(),
        ...formIngreso,
        estado: 'hospitalizado'
      };
      const res = await fetch('/api/internados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoInternado)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar el internamiento');
      await fetchInternados();
      setFormIngreso({
        dni_paciente: '',
        nombre_paciente: '',
        cama: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        tiempo_estancia_num: '1',
        tiempo_estancia_unidad: 'dias',
        fecha_estimada_salida: '',
        diagnostico: '',
        observaciones: ''
      });
      setMensajeDni(null);
      alert('🏥 Ingreso de paciente registrado con éxito.');
    } catch (err) {
      console.error('Error guardando internado:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar el internamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSalidaId) {
      alert('Selecciona un paciente en cama para registrar su salida');
      return;
    }
    try {
      setSaving(true);
      const pacienteEncontrado = internados.find(i => String(i.id) === String(pacienteSalidaId));
      if (!pacienteEncontrado) return;
      const pacienteAlta: Internado = {
        ...pacienteEncontrado,
        estado: 'alta',
        ...formSalida
      };
      const response = await fetch(`/api/internados/${pacienteSalidaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'alta', ...formSalida })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo registrar el alta');
      setInternados(prev => prev.map(i => String(i.id) === String(pacienteSalidaId) ? pacienteAlta : i));
      alert(`✅ Salida / Alta registrada con éxito para ${pacienteEncontrado.nombre_paciente}`);
      setPacienteSalidaId('');
      setFormSalida({
        fecha_salida: new Date().toISOString().split('T')[0],
        hora_salida: '',
        motivo_salida: '',
        notas_salida: ''
      });
      setTipoFormulario('ingreso');
    } catch (err) {
      console.error('Error al registrar salida:', err);
      alert(err instanceof Error ? err.message : 'No se pudo registrar el alta');
    } finally {
      setSaving(false);
    }
  };

  const iniciarProcesoSalida = (item: Internado) => {
    setTipoFormulario('salida');
    setPacienteSalidaId(item.id);
  };

  const internadosFiltrados = internados.filter(i => 
    (i.nombre_paciente || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (i.dni_paciente || '').includes(filtro) ||
    (i.cama || '').toLowerCase().includes(filtro.toLowerCase())
  );

  const activosCount = internados.filter(i => i.estado !== 'alta').length;
  const pacientesHospitalizados = internados.filter(i => i.estado !== 'alta');
  const pacienteSalidaSeleccionado = internados.find(i => String(i.id) === String(pacienteSalidaId));

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
              Módulo / <strong className="text-slate-900">Internados y Hospedaje Clínico</strong>
            </span>
          </div>
          <span className="text-xs text-amber-700 font-extrabold bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shrink-0">
            🏥 Control de Camas y Observación
          </span>
        </header>

        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="m-0 text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                🏥 Gestión de Pacientes Internados
              </h1>
              <p className="m-0 text-xs md:text-sm text-slate-500 mt-1">
                Monitoreo de camas ocupadas, altas médicas y hospedaje en clínica.
              </p>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl text-center shadow-sm w-full sm:w-auto shrink-0">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                INTERNADOS ACTIVOS
              </span>
              <div className="text-xl font-black text-amber-600">{activosCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setTipoFormulario('ingreso')}
                  className={`flex-1 py-3 px-2 text-xs font-extrabold border-none cursor-pointer transition-all ${
                    tipoFormulario === 'ingreso'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🛌 Registrar Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFormulario('salida')}
                  className={`flex-1 py-3 px-2 text-xs font-extrabold border-none cursor-pointer transition-all ${
                    tipoFormulario === 'salida'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🚪 Registrar Salida / Alta
                </button>
              </div>

              {tipoFormulario === 'ingreso' && (
                <form onSubmit={handleSubmitIngreso} className="p-5 flex flex-col gap-3.5">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <label className="block text-[11px] font-extrabold text-amber-900 mb-1 uppercase tracking-wider">
                      👤 Seleccionar Paciente Registrado en Recepción
                    </label>
                    <select
                      onChange={handleSelectPacienteLista}
                      value={formIngreso.dni_paciente}
                      className="w-full p-2.5 rounded-xl border border-amber-400 bg-white font-bold text-slate-900 text-xs outline-none cursor-pointer shadow-sm"
                    >
                      <option value="">-- Seleccionar paciente de la lista --</option>
                      {pacientesRegistrados.map((p) => {
                        const dniVal = p.dni || p.dni_paciente;
                        return (
                          <option key={p.id || dniVal} value={dniVal}>
                            {p.nombre || p.nombre_paciente} (DNI: {dniVal})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      DNI DEL PACIENTE *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        name="dni_paciente"
                        value={formIngreso.dni_paciente}
                        onChange={handleDniChange}
                        placeholder="Ej: 71234567"
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => buscarPacientePorDni(formIngreso.dni_paciente)}
                        className="bg-slate-100 border border-slate-300 rounded-xl px-3 cursor-pointer font-bold text-xs hover:bg-slate-200 transition-all"
                        title="Buscar paciente"
                      >
                        🔍
                      </button>
                    </div>
                    {buscandoDni && (
                      <span className="text-[11px] text-amber-600 font-bold mt-1 block">
                        🔎 Buscando paciente registrado...
                      </span>
                    )}
                    {mensajeDni && (
                      <span className={`text-[11px] font-bold mt-1 block ${
                        mensajeDni.tipo === 'exito' ? 'text-emerald-700' : 'text-sky-700'
                      }`}>
                        {mensajeDni.texto}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      NOMBRE COMPLETO *
                    </label>
                    <input
                      type="text"
                      name="nombre_paciente"
                      value={formIngreso.nombre_paciente}
                      onChange={handleChangeIngreso}
                      placeholder="Ej: Juan Carlos Pérez"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        CAMA / N° HAB *
                      </label>
                      <input
                        type="text"
                        name="cama"
                        value={formIngreso.cama}
                        onChange={handleChangeIngreso}
                        placeholder="Ej: Cama 03"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        FECHA INGRESO
                      </label>
                      <input
                        type="date"
                        name="fecha_ingreso"
                        value={formIngreso.fecha_ingreso}
                        onChange={handleChangeIngreso}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                    <label className="block text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                      ⏳ TIEMPO ESTIMADO DE ESTANCIA
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">CANTIDAD</label>
                        <input
                          type="number"
                          min="1"
                          name="tiempo_estancia_num"
                          value={formIngreso.tiempo_estancia_num}
                          onChange={handleChangeIngreso}
                          placeholder="Ej: 3"
                          className="w-full p-2 rounded-lg border border-slate-300 font-bold text-slate-900 text-xs outline-none focus:border-amber-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">UNIDAD</label>
                        <select
                          name="tiempo_estancia_unidad"
                          value={formIngreso.tiempo_estancia_unidad}
                          onChange={handleChangeIngreso}
                          className="w-full p-2 rounded-lg border border-slate-300 font-bold text-slate-900 text-xs outline-none focus:border-amber-600 bg-white cursor-pointer"
                        >
                          <option value="dias">Día(s)</option>
                          <option value="semanas">Semana(s)</option>
                          <option value="meses">Mes(es)</option>
                        </select>
                      </div>
                    </div>
                    {formIngreso.fecha_estimada_salida && (
                      <span className="text-[11px] font-extrabold text-amber-700 mt-1 block bg-amber-50 p-2 rounded-lg border border-amber-200">
                        📅 Fecha probable de alta: <strong>{formIngreso.fecha_estimada_salida}</strong>
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      DIAGNÓSTICO PRELIMINAR
                    </label>
                    <input
                      type="text"
                      name="diagnostico"
                      value={formIngreso.diagnostico}
                      onChange={handleChangeIngreso}
                      placeholder="Ej: Deshidratación / Observación"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      NOTAS DE ENFERMERÍA
                    </label>
                    <textarea
                      name="observaciones"
                      rows={2}
                      value={formIngreso.observaciones}
                      onChange={handleChangeIngreso}
                      placeholder="Indicaciones especiales de hospedaje..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-amber-600 focus:bg-white resize-y"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 p-3 bg-amber-600 hover:bg-amber-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>🏥</span> {saving ? 'Registrando...' : 'Registrar Internamiento'}
                  </button>
                </form>
              )}

              {tipoFormulario === 'salida' && (
                <form onSubmit={handleSubmitSalida} className="p-5 flex flex-col gap-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      SELECCIONAR PACIENTE EN CAMA *
                    </label>
                    <select
                      value={pacienteSalidaId}
                      onChange={(e) => setPacienteSalidaId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-emerald-600 focus:bg-white"
                      required
                    >
                      <option value="">-- Seleccione paciente hospitalizado --</option>
                      {pacientesHospitalizados.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre_paciente} ({p.cama} - DNI: {p.dni_paciente})
                        </option>
                      ))}
                    </select>
                  </div>
                  {pacienteSalidaSeleccionado && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <strong>Paciente:</strong> {pacienteSalidaSeleccionado.nombre_paciente}<br />
                      <strong>Cama:</strong> {pacienteSalidaSeleccionado.cama} | <strong>Ingresó:</strong> {pacienteSalidaSeleccionado.fecha_ingreso || 'Sin fecha'}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        FECHA DE SALIDA *
                      </label>
                      <input
                        type="date"
                        name="fecha_salida"
                        value={formSalida.fecha_salida}
                        onChange={handleChangeSalida}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-emerald-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        HORA DE SALIDA
                      </label>
                      <input
                        type="time"
                        name="hora_salida"
                        value={formSalida.hora_salida}
                        onChange={handleChangeSalida}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      MOTIVO DE ALTA / SALIDA
                    </label>
                    <input
                      type="text"
                      name="motivo_salida"
                      value={formSalida.motivo_salida}
                      onChange={handleChangeSalida}
                      placeholder="Ej: Alta Médica por Mejoría / Retiro Voluntario"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      NOTAS O RECOMENDACIONES DE SALIDA
                    </label>
                    <textarea
                      name="notas_salida"
                      rows={2}
                      value={formSalida.notas_salida}
                      onChange={handleChangeSalida}
                      placeholder="Tratamiento ambulatorio, medicamentos..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-emerald-600 focus:bg-white resize-y"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>✅</span> {saving ? 'Guardando Salida...' : 'Confirmar y Guardar Salida'}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                    📋
                  </div>
                  <div>
                    <h2 className="m-0 text-sm md:text-base font-extrabold text-white">Pacientes en Cama / Hospedaje</h2>
                    <p className="m-0 text-xs text-slate-400">{internados.length} registros totales</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar DNI, Cama o Paciente..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full sm:w-56 p-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs outline-none"
                />
              </div>
              <div className="p-4 flex flex-col gap-3 max-h-[550px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Cargando historial de internamientos...
                  </div>
                ) : internadosFiltrados.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="text-3xl mb-2">🛏️</div>
                    <p className="m-0 text-slate-700 text-xs md:text-sm font-bold">
                      No hay pacientes hospitalizados actualmente.
                    </p>
                    <span className="text-xs text-slate-400">Ingresa los datos en el formulario para ocupar una cama.</span>
                  </div>
                ) : (
                  internadosFiltrados.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-slate-300 transition-all ${
                        item.estado === 'alta' ? 'border-l-4 border-l-emerald-600 border-slate-200' : 'border-l-4 border-l-amber-600 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{item.nombre_paciente}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                            DNI: {item.dni_paciente}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                            item.estado === 'alta' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.estado === 'alta' ? '✅ Alta Médica Registrada' : '🛌 Hospitalizado'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 font-semibold">
                          <span className="text-amber-600 font-black">🏥 {item.cama}</span>
                          <span>📅 Ingreso: {item.fecha_ingreso || 'Sin fecha'}</span>
                          {item.tiempo_estancia_num && (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                              ⏳ Estancia: {item.tiempo_estancia_num} {item.tiempo_estancia_unidad}
                              {item.fecha_estimada_salida && ` (Est. Alta: ${item.fecha_estimada_salida})`}
                            </span>
                          )}
                          {item.fecha_salida && (
                            <span className="text-emerald-700">🚪 Salida: {item.fecha_salida} {item.hora_salida ? `(${item.hora_salida})` : ''}</span>
                          )}
                          {item.diagnostico && <span>🩺 {item.diagnostico}</span>}
                        </div>
                        {item.motivo_salida && (
                          <div className="mt-1 text-xs text-emerald-800 font-semibold">
                            <strong>Motivo de Salida:</strong> {item.motivo_salida} {item.notas_salida ? `— ${item.notas_salida}` : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {item.estado !== 'alta' && (
                          <button
                            type="button"
                            onClick={() => iniciarProcesoSalida(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none px-3 py-2 rounded-lg font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            🚪 Registrar Salida
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEliminarInternado(item.id)}
                          title="Eliminar registro de prueba"
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg p-2 text-xs font-bold cursor-pointer transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default function InternadosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando...</div>}>
      <InternadosPageContent />
    </Suspense>
  );
}

