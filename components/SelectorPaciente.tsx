'use client';

import { useState, useEffect } from 'react';

interface SelectorProps {
  valSeleccionado?: string;
  onSelectPaciente: (paciente: { dni: string; nombre: string; id?: number }) => void;
  label?: string;
}

export default function SelectorPaciente({ onSelectPaciente, label = "Seleccionar Paciente (Registrado en Recepción)" }: SelectorProps) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Carga automáticamente todos los pacientes creados en Recepción
    fetch('/api/pacientes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPacientes(data);
      })
      .catch((err) => console.error('Error cargando pacientes:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dniElegido = e.target.value;
    const pacEncontrado = pacientes.find((p) => p.dni === dniElegido);
    if (pacEncontrado) {
      onSelectPaciente(pacEncontrado);
    } else {
      onSelectPaciente({ dni: '', nombre: '' });
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
        {label} *
      </label>
      <select
        onChange={handleChange}
        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs sm:text-sm outline-none focus:border-teal-600 shadow-sm cursor-pointer"
        required
      >
        <option value="">{loading ? 'Cargando pacientes...' : '-- Seleccione un paciente de la lista --'}</option>
        {pacientes.map((p) => (
          <option key={p.id} value={p.dni}>
            👤 {p.nombre} — (DNI: {p.dni})
          </option>
        ))}
      </select>
    </div>
  );
}
