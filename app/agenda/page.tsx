'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Cita {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  telefono: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado?: 'pendiente' | 'confirmada' | 'atendido' | 'cancelada';
}

function AgendaPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');

  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientesRegistrados, setPacientesRegistrados] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [buscandoPaciente, setBuscandoPaciente] = useState<boolean>(false);
  const [filtro, setFiltro] = useState<string>('');
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'nueva'>('lista');
  
  const [citaDetalleModal, setCitaDetalleModal] = useState<Cita | null>(null);
  const [form, setForm] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    telefono: '',
    fecha: '',
    hora: '',
    motivo: 'Control médico y evaluación general'
  });

  useEffect(() => {
    fetchCitas();
    fetchPacientesRegistrados();
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
      cargarDatosPacientePorDni(dniTarget);
    }
  }, [dniParam, pacientesRegistrados]);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/citas');
      if (res.ok) {
        const data = await res.json();
        setCitas(data);
      }
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientesRegistrados = async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) {
        const data = await res.json();
        setPacientesRegistrados(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando lista de pacientes:', err);
    }
  };

  const cargarDatosPacientePorDni = async (dniIngresado: string) => {
    const dniLimpio = dniIngresado.trim();
    if (!dniLimpio) return;

    try {
      setBuscandoPaciente(true);
      const encontrado = pacientesRegistrados.find(p => (p.dni || p.dni_paciente) === dniLimpio);
      if (encontrado) {
        setForm(prev => ({
          ...prev,
          dni_paciente: encontrado.dni || encontrado.dni_paciente || dniLimpio,
          nombre_paciente: encontrado.nombre || encontrado.nombre_paciente || prev.nombre_paciente,
          telefono: encontrado.telefono || encontrado.celular || prev.telefono
        }));
        return;
      }

      const res = await fetch('/api/pacientes');
      if (res.ok) {
        const todos = await res.json();
        if (Array.isArray(todos)) {
          const paciente = todos.find(p => (p.dni || p.dni_paciente) === dniLimpio);
          if (paciente) {
            setForm(prev => ({
              ...prev,
              dni_paciente: dniLimpio,
              nombre_paciente: paciente.nombre || paciente.nombre_paciente || prev.nombre_paciente,
              telefono: paciente.telefono || paciente.celular || prev.telefono
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error buscando paciente:', error);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'dni_paciente') {
      setForm(prev => ({ ...prev, dni_paciente: value }));
      if (value.length === 8) {
        cargarDatosPacientePorDni(value);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectPacienteLista = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dniElegido = e.target.value;
    if (!dniElegido) {
      setForm(prev => ({ ...prev, dni_paciente: '', nombre_paciente: '', telefono: '' }));
      return;
    }
    const paciente = pacientesRegistrados.find(p => (p.dni === dniElegido || p.dni_paciente === dniElegido));
    if (paciente) {
      const nombre = paciente.nombre || paciente.nombre_paciente || '';
      const dniVal = paciente.dni || paciente.dni_paciente || '';
      const telVal = paciente.telefono || paciente.celular || '';

      setForm(prev => ({
        ...prev,
        dni_paciente: dniVal,
        nombre_paciente: nombre,
        telefono: telVal
      }));

      localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
        dni: dniVal,
        nombre: nombre
      }));
      window.dispatchEvent(new Event('paciente_activo_changed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dni_paciente || !form.nombre_paciente || !form.fecha || !form.hora) {
      alert('Por favor completa los campos obligatorios (*)');
      return;
    }
    try {
      setSaving(true);
      const nuevaCita: Cita = {
        id: Date.now(),
        ...form,
        estado: 'pendiente'
      };
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaCita)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar la cita');
      await fetchCitas();
      
      setCitaDetalleModal(nuevaCita);
      setForm({
        dni_paciente: '',
        nombre_paciente: '',
        telefono: '',
        fecha: '',
        hora: '',
        motivo: 'Control médico y evaluación general'
      });
      setVistaActiva('lista');
    } catch (err) {
      console.error('Error guardando cita:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  const enviarWhatsApp = (c: Cita) => {
    const mensaje = `Hola ${c.nombre_paciente}, le recordamos su cita médica en Vital Salud programada para el ${c.fecha} a las ${c.hora}. Motivo: ${c.motivo}. ¡Le esperamos!`;
    const url = `https://wa.me/51${c.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleEliminarCita = async (id: string | number) => {
    if (confirm('¿Deseas cancelar y eliminar esta cita de la agenda?')) {
      setCitas(prev => prev.filter(c => c.id !== id));
    }
  };

  const citasFiltradas = citas.filter(c => 
    (c.nombre_paciente || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (c.dni_paciente || '').includes(filtro)
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
            Módulo Médico / <strong className="text-slate-900">Gestión de Agenda y Citas</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sky-700 font-extrabold bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200 shrink-0">
              🗓️ Agenda Clínica Digital
            </span>
          </div>
        </header>

        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-xl font-bold shrink-0">📅</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Citas Registradas</span>
                <h3 className="m-0 text-xl font-black text-slate-900">{citas.length}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">⏳</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Pendientes</span>
                <h3 className="m-0 text-xl font-black text-slate-900">{citas.filter(c => c.estado !== 'atendido').length}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">✅</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Confirmadas</span>
                <h3 className="m-0 text-xl font-black text-slate-900">{citas.length}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl shrink-0">🩺</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Atenciones Hoy</span>
                <h3 className="m-0 text-xl font-black text-slate-900">0</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setVistaActiva('lista')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-extrabold text-xs md:text-sm border-none cursor-pointer transition-all ${
                  vistaActiva === 'lista' ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                📋 Citas Programadas ({citas.length})
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('nueva')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-extrabold text-xs md:text-sm border-none cursor-pointer transition-all ${
                  vistaActiva === 'nueva' ? 'bg-sky-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                ➕ Programar Cita
              </button>
            </div>
            {vistaActiva === 'lista' && (
              <input
                type="text"
                placeholder="🔍 Buscar por DNI o Paciente..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
              />
            )}
          </div>

          {vistaActiva === 'lista' && (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200">
                  Cargando la agenda de citas...
                </div>
              ) : citasFiltradas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
                  <span className="text-4xl block mb-2">🗓️</span>
                  <h3 className="m-0 text-base md:text-lg font-extrabold text-slate-900 mb-1">No hay citas en la agenda</h3>
                  <p className="m-0 text-xs md:text-sm text-slate-500">
                    Haz clic en el botón <strong>"+ Programar Cita"</strong> arriba para agendar a un paciente.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {citasFiltradas.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:border-sky-300 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-sky-100 text-sky-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-black uppercase">CITA</span>
                          <span className="text-sm font-black">#{idx + 1}</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900">{c.nombre_paciente}</h3>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                              DNI: {c.dni_paciente}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 font-semibold">
                            <span>📆 Fecha: <strong className="text-slate-900">{c.fecha}</strong></span>
                            <span>🕒 Hora: <strong className="text-sky-600">{c.hora}</strong></span>
                            <span>🩺 Motivo: {c.motivo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() => setCitaDetalleModal(c)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 px-3 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all"
                        >
                          👁️ Ver Ticket
                        </button>
                        {c.telefono && (
                          <button
                            type="button"
                            onClick={() => enviarWhatsApp(c)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-2 rounded-xl font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            📲 Recordatorio
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEliminarCita(c.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl p-2 text-xs font-extrabold cursor-pointer transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vistaActiva === 'nueva' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-8 shadow-sm">
              <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-4 rounded-xl text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Formulario de Programación de Citas</h3>
                  <p className="m-0 text-xs text-sky-100">Complete los campos requeridos para reservar el turno en agenda</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200">
                  <label className="block text-[11px] font-extrabold text-sky-900 mb-1 uppercase tracking-wider">
                    👤 Seleccionar Paciente Registrado en Recepción
                  </label>
                  <select
                    onChange={handleSelectPacienteLista}
                    value={form.dni_paciente}
                    className="w-full p-3 rounded-xl border border-sky-400 bg-white font-bold text-slate-900 text-xs md:text-sm outline-none cursor-pointer shadow-sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      DNI DEL PACIENTE * {buscandoPaciente && <span className="text-sky-600 font-bold">(Buscando...)</span>}
                    </label>
                    <input
                      type="text"
                      name="dni_paciente"
                      maxLength={8}
                      value={form.dni_paciente}
                      onChange={handleChange}
                      placeholder="Ingrese DNI (8 dígitos)"
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      NOMBRE Y APELLIDOS DEL PACIENTE *
                    </label>
                    <input
                      type="text"
                      name="nombre_paciente"
                      value={form.nombre_paciente}
                      onChange={handleChange}
                      placeholder="Ejemplo: Juan Carlos Pérez"
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      TELÉFONO / WHATSAPP
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 987654321"
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      FECHA DE CITA *
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      value={form.fecha}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                      HORA DE ATENCIÓN *
                    </label>
                    <input
                      type="time"
                      name="hora"
                      value={form.hora}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                    MOTIVO O CONSULTA MÉDICA
                  </label>
                  <input
                    type="text"
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChange}
                    placeholder="Ej: Control general, evaluación de análisis, etc."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-sky-600 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setVistaActiva('lista')}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-extrabold text-xs md:text-sm cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>🗓️</span> {saving ? 'Agendando...' : 'Confirmar y Guardar Cita'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>

        {citaDetalleModal && (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h3 className="m-0 text-base font-extrabold text-white">Ticket de Cita Programada</h3>
                    <p className="m-0 text-xs text-sky-100">Vital Salud — Agenda Médica</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCitaDetalleModal(null)}
                  className="bg-white/20 text-white border-none rounded-full w-8 h-8 flex items-center justify-center font-bold cursor-pointer hover:bg-white/30 transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                  <span className="text-[10px] font-extrabold text-sky-700 uppercase block mb-1">PACIENTE</span>
                  <h2 className="m-0 text-lg font-black text-slate-900">{citaDetalleModal.nombre_paciente}</h2>
                  <span className="text-xs text-slate-600 font-bold">DNI: {citaDetalleModal.dni_paciente}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] text-slate-500 font-bold block">FECHA</span>
                    <strong className="text-sm text-slate-900">📆 {citaDetalleModal.fecha}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[11px] text-slate-500 font-bold block">HORA</span>
                    <strong className="text-sm text-sky-600">🕒 {citaDetalleModal.hora}</strong>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">MOTIVO</span>
                  <span className="text-xs text-slate-900 font-bold">🩺 {citaDetalleModal.motivo}</span>
                </div>
                {citaDetalleModal.telefono && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-extrabold block">TELÉFONO</span>
                      <strong className="text-xs text-emerald-950">📞 {citaDetalleModal.telefono}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => enviarWhatsApp(citaDetalleModal)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-2 rounded-lg font-extrabold text-xs cursor-pointer flex items-center gap-1"
                    >
                      📲 WhatsApp
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCitaDetalleModal(null)}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white border-none rounded-xl font-extrabold text-xs cursor-pointer transition-all"
                >
                  ✅ Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando...</div>}>
      <AgendaPageContent />
    </Suspense>
  );
}

