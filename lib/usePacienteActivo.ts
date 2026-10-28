'use client';

import { useState, useEffect } from 'react';

export interface PacienteActivo {
  dni: string;
  nombre: string;
}

export function usePacienteActivo() {
  const [pacienteActivo, setPacienteActivoState] = useState<PacienteActivo | null>(null);

  useEffect(() => {
    // Cargar paciente activo desde localStorage al iniciar
    const guardado = localStorage.getItem('paciente_activo_vital_salud');
    if (guardado) {
      try {
        setPacienteActivoState(JSON.parse(guardado));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const seleccionarPaciente = (paciente: PacienteActivo) => {
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify(paciente));
    setPacienteActivoState(paciente);
    // Disparar evento para que otros componentes (como el Sidebar) se enteren al instante
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const deseleccionarPaciente = () => {
    localStorage.removeItem('paciente_activo_vital_salud');
    setPacienteActivoState(null);
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  return {
    pacienteActivo,
    seleccionarPaciente,
    deseleccionarPaciente,
  };
}
