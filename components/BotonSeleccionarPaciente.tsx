'use client';

import { useState, useEffect } from 'react';

interface Props {
  dni: string;
  nombre: string;
}

export default function BotonSeleccionarPaciente({ dni, nombre }: Props) {
  const [esActivo, setEsActivo] = useState(false);

  const verificarEstado = () => {
    const data = localStorage.getItem('paciente_activo_vital_salud');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setEsActivo(parsed.dni === dni);
      } catch (e) {
        setEsActivo(false);
      }
    } else {
      setEsActivo(false);
    }
  };

  useEffect(() => {
    verificarEstado();
    window.addEventListener('paciente_activo_changed', verificarEstado);
    return () => window.removeEventListener('paciente_activo_changed', verificarEstado);
  }, [dni]);

  const toggleSeleccion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (esActivo) {
      // Si ya está activo, lo quitamos
      localStorage.removeItem('paciente_activo_vital_salud');
    } else {
      // Reemplaza automáticamente al paciente anterior
      localStorage.setItem(
        'paciente_activo_vital_salud',
        JSON.stringify({ dni, nombre })
      );
    }
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  return (
    <button
      type="button"
      onClick={toggleSeleccion}
      className={`px-3.5 py-2 rounded-xl font-extrabold text-xs cursor-pointer border transition-all flex items-center gap-1.5 shadow-sm ${
        esActivo
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20 ring-2 ring-emerald-400/30'
          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
      }`}
    >
      <span>{esActivo ? '✓ Seleccionado' : '📌 Seleccionar'}</span>
    </button>
  );
}
