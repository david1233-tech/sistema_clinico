'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SelectorPaciente from '@/components/SelectorPaciente';

interface Triaje {
  id: number | string;
  dni_paciente: string;
  nombre_paciente?: string;
  temperatura: string;
  presion: string;
  frecuencia_cardiaca?: string;
  saturacion?: string;
  peso?: string;
  talla?: string;
  observaciones?: string;
  fecha?: string;
}

export default function TriajePage() {
  const [triajes, setTriajes] = useState<Triaje[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [form, setForm] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    temperatura: '',
    presion: '',
    frecuencia_cardiaca: '',
    saturacion: '',
    peso: '',
    talla: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchTriajes();
  }, []);

  const fetchTriajes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/triaje');
      if (res.ok) {
        const data = await res.json();
        setTriajes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error al cargar triajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaciente = (paciente: { dni: string; nombre: string }) => {
    setForm((prev) => ({
      ...prev,
      dni_paciente: paciente.dni,
      nombre_paciente: paciente.nombre
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dni_paciente || !form.temperatura || !form.presion) {
      alert('⚠️ Por favor seleccione un paciente y complete temperatura y presión');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/triaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        alert('✅ Triaje registrado con éxito');
        setForm({
          dni_paciente: '',
          nombre_paciente: '',
          temperatura: '',
          presion: '',
          frecuencia_cardiaca: '',
          saturacion: '',
          peso: '',
          talla: '',
          observaciones: ''
        });
        fetchTriajes();
      } else {
        alert('Error al guardar el triaje');
      }
    } catch (err) {
      console.error('Error guardando triaje:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate pl-10 md:pl-0">
            Módulo Enfermería / <strong className="text-slate-900">Triaje y Signos Vitales</strong>
          </span>
          <span className="text-xs text-teal-700 font-extrabold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 shrink-0">
            🩺 Control Vital
          </span>
        </header>

        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="m-0 text-xl md:text-2xl font-black text-slate-900">🩺 Registro de Triaje</h1>
            <p className="m-0 text-xs md:text-sm text-slate-500 mt-1">
              Seleccione al paciente de la lista creada en Recepción para registrar sus constantes vitales.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
            
            {/* FORMULARIO DE TRIAJE CON SELECTOR AUTOMÁTICO */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm md:text-base font-extrabold m-0 text-slate-900">📋 Tomar Signos Vitales</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                
                {/* SELECTOR AUTOMÁTICO DE PACIENTES */}
                <SelectorPaciente onSelectPaciente={handleSeleccionarPaciente} />

                {form.nombre_paciente && (
                  <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-800 font-bold">
                    Paciente seleccionado: {form.nombre_paciente} (DNI: {form.dni_paciente})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                      Temperatura (°C) *
                    </label>
                    <input
                      type="text"
                      name="temperatura"
                      value={form.temperatura}
                      onChange={handleInputChange}
                      placeholder="Ej: 36.5"
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                      Presión (mmHg) *
                    </label>
                    <input
                      type="text"
                      name="presion"
                      value={form.presion}
                      onChange={handleInputChange}
                      placeholder="Ej: 120/80"
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                      Freq. Cardíaca (BPM)
                    </label>
                    <input
                      type="text"
                      name="frecuencia_cardiaca"
                      value={form.frecuencia_cardiaca}
                      onChange={handleInputChange}
                      placeholder="Ej: 75"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                      SpO2 (%)
                    </label>
                    <input
                      type="text"
                      name="saturacion"
                      value={form.saturacion}
                      onChange={handleInputChange}
                      placeholder="Ej: 98%"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    rows={2}
                    value={form.observaciones}
                    onChange={handleInputChange}
                    placeholder="Escriba sintomatología u observaciones..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-md transition-all mt-2"
                >
                  💾 {saving ? 'Guardando...' : 'Guardar Triaje'}
                </button>
              </form>
            </div>

            {/* TABLA DE TRIAJES RECIENTES */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <h2 className="text-sm md:text-base font-extrabold m-0 text-slate-900">📊 Triajes Registrados</h2>

              {loading ? (
                <p className="text-slate-400 text-xs">Cargando triajes...</p>
              ) : triajes.length === 0 ? (
                <p className="text-slate-400 text-xs">No hay triajes registrados aún.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                  {triajes.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 block">{t.nombre_paciente || `DNI: ${t.dni_paciente}`}</strong>
                        <span className="text-slate-500">Temp: {t.temperatura}°C • P.A: {t.presion}</span>
                      </div>
                      <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold text-[10px]">Registrado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
