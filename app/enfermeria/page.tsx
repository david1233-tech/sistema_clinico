'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Triaje {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  fecha_hora?: string;
  edad: string | number;
  talla: string | number;
  peso: string | number;
  imc: string | number;
  pulso: string | number;
  so2: string | number;
  temperatura: string | number;
  hb: string | number;
  agua_porcentaje?: string;
  grasa_porcentaje?: string;
  grasa_visceral?: string;
  musculo_esqueletico_porcentaje?: string;
  musculos_porcentaje?: string;
  metabolismo?: string;
  proteina?: string;
  grado_obesidad_porcentaje?: string;
  edad_metabolica?: string;
  circunferencia_abdominal?: string;
  presion_arterial?: string;
  frecuencia_respiratoria?: string;
  glucosa?: string;
  globulos_rojos?: string;
  globulos_blancos?: string;
  hb_glicosilada?: string;
  vcm?: string;
  colesterol?: string;
  trigliceridos?: string;
  creatinina?: string;
  urea?: string;
  tgo?: string;
  tgp?: string;
  t3_t4_tsh?: string;
  examenes_solicitados?: string;
  antecedentes?: string;
  observaciones?: string;
  archivo_adjunto?: string;
}

interface Adjunto { id: number; nombre: string; tipo: string; fecha: string }
const MAX_ADJUNTOS_TRIAJE = 200;

function EnfermeriaContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const [triajes, setTriajes] = useState<Triaje[]>([]);
  const [pacientesRegistrados, setPacientesRegistrados] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [buscandoDni, setBuscandoDni] = useState<boolean>(false);
  const [filtro, setFiltro] = useState<string>('');
  const [mostrarOpcionales, setMostrarOpcionales] = useState<boolean>(true);
  
  const [triajeImprimir, setTriajeImprimir] = useState<Triaje | null>(null);
  const [archivoModal, setArchivoModal] = useState<string | null>(null);
  const [tipoArchivoModal, setTipoArchivoModal] = useState('');
  const [carpetaAbierta, setCarpetaAbierta] = useState(false);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [pendientes, setPendientes] = useState<File[]>([]);
  const [avanceSubida, setAvanceSubida] = useState<{ completados: number; total: number } | null>(null);
  const [camaraActiva, setCamaraActiva] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [form, setForm] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    edad: '',
    talla: '',
    peso: '',
    imc: '',
    pulso: '',
    so2: '',
    temperatura: '',
    hb: '',
    agua_porcentaje: '',
    grasa_porcentaje: '',
    grasa_visceral: '',
    musculo_esqueletico_porcentaje: '',
    musculos_porcentaje: '',
    metabolismo: '',
    proteina: '',
    grado_obesidad_porcentaje: '',
    edad_metabolica: '',
    circunferencia_abdominal: '',
    presion_arterial: '',
    frecuencia_respiratoria: '',
    glucosa: '',
    globulos_rojos: '',
    globulos_blancos: '',
    hb_glicosilada: '',
    vcm: '',
    colesterol: '',
    trigliceridos: '',
    creatinina: '',
    urea: '',
    tgo: '',
    tgp: '',
    t3_t4_tsh: '',
    examenes_solicitados: '',
    antecedentes: '',
    observaciones: '',
    archivo_adjunto: ''
  });

  useEffect(() => {
    fetchTriajes();
    fetchPacientes();
  }, []);

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

  useEffect(() => {
    const pesoNum = parseFloat(form.peso);
    const tallaNum = parseFloat(form.talla) / 100;
    if (pesoNum > 0 && tallaNum > 0) {
      const imcCalculado = (pesoNum / (tallaNum * tallaNum)).toFixed(1);
      setForm(prev => ({ ...prev, imc: imcCalculado }));
    }
  }, [form.peso, form.talla]);

  const abrirCamara = async () => {
    try {
      setCamaraActiva(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      alert('No se pudo acceder a la cámara.');
      setCamaraActiva(false);
    }
  };

  const cerrarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(false);
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (adjuntos.length + pendientes.length >= MAX_ADJUNTOS_TRIAJE) {
          alert('Se permiten hasta 200 adjuntos por triaje.');
        } else {
          canvas.toBlob(blob => {
            if (blob) setPendientes(prev => [...prev, new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' })]);
          }, 'image/jpeg', 0.85);
        }
      }
    }
    cerrarCamara();
  };

  const fetchTriajes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/triaje');
      if (res.ok) {
        const data = await res.json();
        setTriajes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando triajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        setPacientesRegistrados(lista);
      }
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    }
  };

  const cargarDatosPacientePorDni = async (dni: string) => {
    if (!dni) return;
    try {
      setBuscandoDni(true);
      const triajeExistente = triajes.find(t => t.dni_paciente === dni);
      if (triajeExistente) {
        handleSeleccionarHistorial(triajeExistente);
        return;
      }
      const enc = pacientesRegistrados.find(p => (p.dni || p.dni_paciente) === dni);
      if (enc) {
        setForm(prev => ({
          ...prev,
          dni_paciente: enc.dni || enc.dni_paciente || dni,
          nombre_paciente: enc.nombre || enc.nombre_paciente || prev.nombre_paciente,
          edad: enc.edad ? String(enc.edad) : prev.edad
        }));
      } else {
        const res = await fetch('/api/pacientes');
        if (res.ok) {
          const todos = await res.json();
          if (Array.isArray(todos)) {
            const encontrado = todos.find(p => (p.dni || p.dni_paciente) === dni);
            if (encontrado) {
              setForm(prev => ({
                ...prev,
                dni_paciente: dni,
                nombre_paciente: encontrado.nombre || encontrado.nombre_paciente || prev.nombre_paciente,
                edad: encontrado.edad ? String(encontrado.edad) : prev.edad
              }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error buscando paciente por DNI:', err);
    } finally {
      setBuscandoDni(false);
    }
  };

  const handleSelectPaciente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dniElegido = e.target.value;
    if (!dniElegido) {
      setAdjuntos([]);
      setPendientes([]);
      setForm(prev => ({
        ...prev,
        dni_paciente: '', nombre_paciente: '', edad: '', talla: '', peso: '', imc: '',
        pulso: '', so2: '', temperatura: '', hb: '', agua_porcentaje: '', grasa_porcentaje: '',
        grasa_visceral: '', musculo_esqueletico_porcentaje: '', musculos_porcentaje: '',
        metabolismo: '', proteina: '', grado_obesidad_porcentaje: '', edad_metabolica: '',
        circunferencia_abdominal: '', presion_arterial: '', frecuencia_respiratoria: '',
        glucosa: '', globulos_rojos: '', globulos_blancos: '', hb_glicosilada: '', vcm: '',
        colesterol: '', trigliceridos: '', creatinina: '', urea: '', tgo: '', tgp: '',
        t3_t4_tsh: '', examenes_solicitados: '', antecedentes: '', observaciones: '', archivo_adjunto: ''
      }));
      return;
    }
    const triajeExistente = triajes.find(t => t.dni_paciente === dniElegido);
    if (triajeExistente) {
      handleSeleccionarHistorial(triajeExistente);
    } else {
      setAdjuntos([]);
      setPendientes([]);
      const paciente = pacientesRegistrados.find(p => (p.dni === dniElegido || p.dni_paciente === dniElegido));
      if (paciente) {
        const nombre = paciente.nombre || paciente.nombre_paciente || '';
        setForm(prev => ({
          ...prev,
          dni_paciente: paciente.dni || paciente.dni_paciente || '',
          nombre_paciente: nombre,
          edad: paciente.edad ? String(paciente.edad) : prev.edad
        }));
      }
    }
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({ dni: dniElegido }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (adjuntos.length + pendientes.length + files.length > MAX_ADJUNTOS_TRIAJE) alert('Se permiten hasta 200 adjuntos por triaje.');
    else if (files.some(file => file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type))) {
      alert('Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB por archivo.');
    } else setPendientes(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const cargarAdjuntos = async (id: string | number) => {
    const res = await fetch(`/api/triaje/adjuntos?id=${id}`);
    if (res.ok) setAdjuntos(await res.json());
    else setAdjuntos([]);
  };

  const subirPendientes = async (id: string | number) => {
    setAvanceSubida({ completados: 0, total: pendientes.length });
    let completados = 0;
    for (const archivo of pendientes) {
      const data = new FormData();
      data.append('triaje_id', String(id));
      data.append('archivo', archivo);
      const res = await fetch('/api/triaje/adjuntos', { method: 'POST', body: data });
      if (!res.ok) throw new Error((await res.json()).error || `No se pudo subir ${archivo.name}`);
      setPendientes(prev => prev.filter(file => file !== archivo));
      completados += 1;
      setAvanceSubida({ completados, total: pendientes.length });
    }
    await cargarAdjuntos(id);
  };

  const abrirAdjunto = (url: string, tipo: string) => {
    setTipoArchivoModal(tipo);
    setArchivoModal(url);
  };

  const eliminarAdjunto = async (id: number) => {
    if (!confirm('¿Eliminar este adjunto guardado?')) return;
    const res = await fetch(`/api/triaje/adjuntos?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAdjuntos(prev => prev.filter(item => item.id !== id));
    else alert('No se pudo eliminar el adjunto.');
  };

  const handleSeleccionarHistorial = (t: Triaje) => {
    setPendientes([]);
    setAdjuntos([]);
    setCarpetaAbierta(false);
    cargarAdjuntos(t.id);
    setForm({
      dni_paciente: t.dni_paciente || '',
      nombre_paciente: t.nombre_paciente || '',
      edad: t.edad ? String(t.edad) : '',
      talla: t.talla ? String(t.talla) : '',
      peso: t.peso ? String(t.peso) : '',
      imc: t.imc ? String(t.imc) : '',
      pulso: t.pulso ? String(t.pulso) : '',
      so2: t.so2 ? String(t.so2) : '',
      temperatura: t.temperatura ? String(t.temperatura) : '',
      hb: t.hb ? String(t.hb) : '',
      agua_porcentaje: t.agua_porcentaje || '',
      grasa_porcentaje: t.grasa_porcentaje || '',
      grasa_visceral: t.grasa_visceral || '',
      musculo_esqueletico_porcentaje: t.musculo_esqueletico_porcentaje || '',
      musculos_porcentaje: t.musculos_porcentaje || '',
      metabolismo: t.metabolismo || '',
      proteina: t.proteina || '',
      grado_obesidad_porcentaje: t.grado_obesidad_porcentaje || '',
      edad_metabolica: t.edad_metabolica || '',
      circunferencia_abdominal: t.circunferencia_abdominal || '',
      presion_arterial: t.presion_arterial || '',
      frecuencia_respiratoria: t.frecuencia_respiratoria || '',
      glucosa: t.glucosa || '',
      globulos_rojos: t.globulos_rojos || '',
      globulos_blancos: t.globulos_blancos || '',
      hb_glicosilada: t.hb_glicosilada || '',
      vcm: t.vcm || '',
      colesterol: t.colesterol || '',
      trigliceridos: t.trigliceridos || '',
      creatinina: t.creatinina || '',
      urea: t.urea || '',
      tgo: t.tgo || '',
      tgp: t.tgp || '',
      t3_t4_tsh: t.t3_t4_tsh || '',
      examenes_solicitados: t.examenes_solicitados || '',
      antecedentes: t.antecedentes || '',
      observaciones: t.observaciones || '',
      archivo_adjunto: t.archivo_adjunto || ''
    });
    setMostrarOpcionales(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'dni_paciente') {
      setForm(prev => ({ ...prev, dni_paciente: value }));
      cargarDatosPacientePorDni(value);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dni_paciente || !form.nombre_paciente) {
      alert('Por favor ingrese DNI y Nombre del paciente');
      return;
    }
    try {
      setSaving(true);
      const fechaActual = new Date().toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const indexExistente = triajes.findIndex(t => t.dni_paciente === form.dni_paciente);
      if (indexExistente >= 0) {
        const triajesCopia = [...triajes];
        const idExistente = triajesCopia[indexExistente].id;
        const triajeActualizado: Triaje = {
          ...triajesCopia[indexExistente],
          ...form,
          id: idExistente,
          fecha_hora: fechaActual
        };
        triajesCopia[indexExistente] = triajeActualizado;
        const response = await fetch('/api/triaje', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(triajeActualizado)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el triaje');
        await subirPendientes(idExistente);
        setTriajes(triajesCopia);
        alert('📋 Triaje del paciente actualizado exitosamente.');
      } else {
        const nuevoTriaje: Triaje = {
          id: Date.now(),
          fecha_hora: fechaActual,
          ...form
        };
        const res = await fetch('/api/triaje', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoTriaje)
        });
        if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar el triaje');
        const creado = await res.json();
        await subirPendientes(creado.data.id);
        await fetchTriajes();
        alert('📋 Nuevo triaje clínico registrado exitosamente.');
      }
    } catch (err) {
      console.error('Error guardando triaje:', err);
      await fetchTriajes();
      alert(err instanceof Error ? err.message : 'No se pudo guardar el triaje');
    } finally {
      setSaving(false);
      setAvanceSubida(null);
    }
  };

  const handleEliminarTriaje = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Desea eliminar este registro de triaje?')) {
      try {
        const response = await fetch(`/api/triaje?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar el triaje');
        setTriajes(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'No se pudo eliminar el triaje');
      }
    }
  };

  const ejecutarImpresionTriaje = (t: Triaje, e: React.MouseEvent) => {
    e.stopPropagation();
    setTriajeImprimir(t);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const triajesFiltrados = triajes.filter(t =>
    (t.nombre_paciente || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (t.dni_paciente || '').includes(filtro)
  );

  return (
    <>
      {/* VISTA A IMPRIMIR */}
      <div className="hidden print:block print:p-6 print:bg-white print:text-black font-sans">
        {triajeImprimir ? (
          <div className="border border-slate-400 p-6 rounded-lg max-w-2xl mx-auto">
            <div className="border-b-2 border-teal-800 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-teal-900 uppercase m-0">CENTRO VITAL SALUD</h1>
                <p className="text-xs text-slate-600 m-0">Ficha Oficial de Triaje y Signos Vitales</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 p-2 rounded border border-slate-300">
                📅 Fecha y Hora: {triajeImprimir.fecha_hora || new Date().toLocaleString('es-PE')}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
              <h3 className="text-sm font-bold uppercase m-0 text-slate-800">
                PACIENTE: {triajeImprimir.nombre_paciente}
              </h3>
              <p className="text-xs m-0 text-slate-600">DNI: {triajeImprimir.dni_paciente} | EDAD: {triajeImprimir.edad} años</p>
            </div>
            <div className="mb-4">
              <h4 className="text-xs font-extrabold uppercase text-teal-900 border-b pb-1 mb-2">SIGNOS VITALES PRINCIPALES</h4>
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
                <div className="p-2 border rounded">Talla: <strong>{triajeImprimir.talla} cm</strong></div>
                <div className="p-2 border rounded">Peso: <strong>{triajeImprimir.peso} kg</strong></div>
                <div className="p-2 border rounded">IMC: <strong>{triajeImprimir.imc}</strong></div>
                <div className="p-2 border rounded">Pulso: <strong>{triajeImprimir.pulso} bpm</strong></div>
                <div className="p-2 border rounded">SpO2: <strong>{triajeImprimir.so2} %</strong></div>
                <div className="p-2 border rounded">Temp: <strong>{triajeImprimir.temperatura} °C</strong></div>
                {triajeImprimir.presion_arterial && <div className="p-2 border rounded">P/A: <strong>{triajeImprimir.presion_arterial} mmHg</strong></div>}
                {triajeImprimir.frecuencia_respiratoria && <div className="p-2 border rounded">F. respiratoria: <strong>{triajeImprimir.frecuencia_respiratoria} rpm</strong></div>}
              </div>
            </div>
            {(triajeImprimir.hb || triajeImprimir.glucosa || triajeImprimir.colesterol || triajeImprimir.trigliceridos || triajeImprimir.agua_porcentaje) && (
              <div className="mb-4">
                <h4 className="text-xs font-extrabold uppercase text-teal-900 border-b pb-1 mb-2">COMPOSICIÓN Y EXÁMENES REGISTRADOS</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {triajeImprimir.hb && <div className="p-2 border rounded">Hemoglobina (HB): <strong>{triajeImprimir.hb}</strong></div>}
                  {triajeImprimir.glucosa && <div className="p-2 border rounded">Glucosa: <strong>{triajeImprimir.glucosa}</strong></div>}
                  {triajeImprimir.colesterol && <div className="p-2 border rounded">Colesterol: <strong>{triajeImprimir.colesterol}</strong></div>}
                  {triajeImprimir.trigliceridos && <div className="p-2 border rounded">Triglicéridos: <strong>{triajeImprimir.trigliceridos}</strong></div>}
                  {triajeImprimir.agua_porcentaje && <div className="p-2 border rounded">Agua: <strong>{triajeImprimir.agua_porcentaje}</strong></div>}
                  {triajeImprimir.grasa_porcentaje && <div className="p-2 border rounded">Grasa: <strong>{triajeImprimir.grasa_porcentaje}</strong></div>}
                </div>
              </div>
            )}
            {triajeImprimir.observaciones && (
              <div className="mb-4 text-xs p-2 border rounded bg-slate-50">
                <strong>Observaciones:</strong> {triajeImprimir.observaciones}
              </div>
            )}
          </div>
        ) : (
          <p>No se seleccionó triaje para imprimir.</p>
        )}
      </div>

      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900 print:hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
          <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
            <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
              Módulo Enfermería / <strong className="text-slate-900">Control de Signos Vitales y Triaje</strong>
            </span>
            <button
              type="button"
              className="text-xs text-teal-800 font-extrabold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 shrink-0 cursor-pointer hover:bg-teal-100 transition-all"
            >
              📋 Registro Clínico Previo
            </button>
          </header>
          <main className="p-4 md:p-8 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full items-start">
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="w-full lg:w-[480px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shrink-0">
              <div className="bg-teal-700 p-4 text-white flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Nuevo Triaje Clínico</h3>
                  <p className="m-0 text-xs text-teal-100">Los campos con (*) son obligatorios</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                  <label className="block text-[11px] font-extrabold text-teal-900 mb-1 uppercase tracking-wider">
                    👤 SELECCIONAR PACIENTE REGISTRADO EN RECEPCIÓN
                  </label>
                  <select
                    onChange={handleSelectPaciente}
                    value={form.dni_paciente}
                    className="w-full p-2.5 rounded-xl border border-teal-300 bg-white font-bold text-slate-900 text-xs outline-none cursor-pointer shadow-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase">
                      DNI PACIENTE * {buscandoDni && <span className="text-teal-600 font-bold">(buscando...)</span>}
                    </label>
                    <input
                      type="text"
                      name="dni_paciente"
                      value={form.dni_paciente}
                      onChange={handleChange}
                      placeholder="Ej: 71234567"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none focus:border-teal-600 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase">
                      NOMBRE PACIENTE *
                    </label>
                    <input
                      type="text"
                      name="nombre_paciente"
                      value={form.nombre_paciente}
                      onChange={handleChange}
                      placeholder="Escribe el nombre..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none focus:border-teal-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-[11px] font-extrabold text-teal-800 uppercase block mb-2 tracking-wider">
                    DATOS PRINCIPALES (OBLIGATORIOS)
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">EDAD *</label>
                      <input
                        type="number"
                        name="edad"
                        value={form.edad}
                        onChange={handleChange}
                        placeholder="Ej: 30"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">TALLA (cm) *</label>
                      <input
                        type="number"
                        name="talla"
                        value={form.talla}
                        onChange={handleChange}
                        placeholder="Ej: 165"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">PESO (kg) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="peso"
                        value={form.peso}
                        onChange={handleChange}
                        placeholder="Ej: 68.5"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">IMC *</label>
                      <input
                        type="text"
                        name="imc"
                        value={form.imc}
                        onChange={handleChange}
                        placeholder="Ej: 24.5"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none focus:border-teal-600 focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">PULSO *</label>
                      <input
                        type="number"
                        name="pulso"
                        value={form.pulso}
                        onChange={handleChange}
                        placeholder="Ej: 72"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">SO2 % *</label>
                      <input
                        type="number"
                        name="so2"
                        value={form.so2}
                        onChange={handleChange}
                        placeholder="Ej: 98"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 mt-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">T° (°C) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="temperatura"
                        value={form.temperatura}
                        onChange={handleChange}
                        placeholder="Ej: 36.5"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">P/A (mmHg) *</label>
                      <input type="text" name="presion_arterial" value={form.presion_arterial} onChange={handleChange} placeholder="120/80" className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">F. Respiratoria (rpm) *</label>
                      <input type="number" min="1" name="frecuencia_respiratoria" value={form.frecuencia_respiratoria} onChange={handleChange} placeholder="18" className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600" required />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-xs flex justify-between items-center transition-all cursor-pointer border border-slate-300 mt-1"
                >
                  <span>{mostrarOpcionales ? '▼ Ocultar Datos Opcionales y Exámenes' : '▶ Mostrar Datos Opcionales y Exámenes'}</span>
                  <span className="bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Ver más</span>
                </button>
                {mostrarOpcionales && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-3 animate-fadeIn text-xs">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block mb-2">
                        💧 COMPOSICIÓN CORPORAL Y METABOLISMO
                      </span>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Agua %</label>
                          <input type="text" name="agua_porcentaje" value={form.agua_porcentaje} onChange={handleChange} placeholder="Ej: 55%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Grasa %</label>
                          <input type="text" name="grasa_porcentaje" value={form.grasa_porcentaje} onChange={handleChange} placeholder="Ej: 22%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">G. Visceral</label>
                          <input type="text" name="grasa_visceral" value={form.grasa_visceral} onChange={handleChange} placeholder="Ej: 8" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">M.MusEque%</label>
                          <input type="text" name="musculo_esqueletico_porcentaje" value={form.musculo_esqueletico_porcentaje} onChange={handleChange} placeholder="Ej: 30%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Músculos%</label>
                          <input type="text" name="musculos_porcentaje" value={form.musculos_porcentaje} onChange={handleChange} placeholder="Ej: 40%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Metabolismo</label>
                          <input type="text" name="metabolismo" value={form.metabolismo} onChange={handleChange} placeholder="Ej: 1450 kcal" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Proteína</label>
                          <input type="text" name="proteina" value={form.proteina} onChange={handleChange} placeholder="Ej: 18%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Grado Obesidad%</label>
                          <input type="text" name="grado_obesidad_porcentaje" value={form.grado_obesidad_porcentaje} onChange={handleChange} placeholder="Ej: +12%" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Edad Metabólica</label>
                          <input type="text" name="edad_metabolica" value={form.edad_metabolica} onChange={handleChange} placeholder="Ej: 32 años" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Circunf. Abdominal</label>
                          <input type="text" name="circunferencia_abdominal" value={form.circunferencia_abdominal} onChange={handleChange} placeholder="Ej: 85 cm" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block mb-2">
                        🧪 EXÁMENES AUXILIARES Y LABORATORIO
                      </span>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">HB (Hemoglobina)</label>
                          <input type="number" step="0.1" name="hb" value={form.hb} onChange={handleChange} placeholder="Ej: 13.5" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Glucosa</label>
                          <input type="text" name="glucosa" value={form.glucosa} onChange={handleChange} placeholder="95 mg/dL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">G. Rojos</label>
                          <input type="text" name="globulos_rojos" value={form.globulos_rojos} onChange={handleChange} placeholder="4.5 mill" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">G. Blancos</label>
                          <input type="text" name="globulos_blancos" value={form.globulos_blancos} onChange={handleChange} placeholder="7500" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Hb. Glicosilada</label>
                          <input type="text" name="hb_glicosilada" value={form.hb_glicosilada} onChange={handleChange} placeholder="5.4 %" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">VCM</label>
                          <input type="text" name="vcm" value={form.vcm} onChange={handleChange} placeholder="88 fL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Colesterol</label>
                          <input type="text" name="colesterol" value={form.colesterol} onChange={handleChange} placeholder="180 mg/dL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Triglicéridos</label>
                          <input type="text" name="trigliceridos" value={form.trigliceridos} onChange={handleChange} placeholder="140 mg/dL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Creatinina</label>
                          <input type="text" name="creatinina" value={form.creatinina} onChange={handleChange} placeholder="0.9 mg/dL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Urea</label>
                          <input type="text" name="urea" value={form.urea} onChange={handleChange} placeholder="25 mg/dL" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">TGO</label>
                          <input type="text" name="tgo" value={form.tgo} onChange={handleChange} placeholder="22 U/L" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">TGP</label>
                          <input type="text" name="tgp" value={form.tgp} onChange={handleChange} placeholder="25 U/L" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 mb-0.5">T3-T4-TSH</label>
                          <input type="text" name="t3_t4_tsh" value={form.t3_t4_tsh} onChange={handleChange} placeholder="Normal / TSH: 2.1" className="w-full p-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-1">
                      <label className="block text-[9px] font-bold text-slate-600 mb-0.5">ANTECEDENTES MÉDICOS</label>
                      <input type="text" name="antecedentes" value={form.antecedentes} onChange={handleChange} placeholder="Ej: Hipertensión, Diabetes..." className="w-full p-2 rounded-lg border border-slate-300 font-bold text-xs bg-white" />
                    </div>
                  </div>
                )}
                <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-200">
                  <label className="block text-[11px] font-extrabold text-teal-900 mb-2 uppercase tracking-wider">
                    📁 FOTOS Y ARCHIVOS DEL TRIAJE
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={abrirCamara}
                      disabled={saving}
                      className="w-full sm:w-auto px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      📸 Tomar Foto
                    </button>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={handleFileChange}
                      disabled={saving}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                    />
                  </div>
                  {camaraActiva && (
                    <div className="mt-3 p-3 bg-slate-900 rounded-xl flex flex-col items-center gap-2 border border-slate-700">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded-lg object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex items-center gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={capturarFoto}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                        >
                          📸 Capturar Foto
                        </button>
                        <button
                          type="button"
                          onClick={cerrarCamara}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-600">Hasta 200 fotos o archivos PDF, 3 MB cada uno. Se guardan al guardar el triaje.</p>
                  {avanceSubida && avanceSubida.total > 0 && <p className="mt-1 text-xs font-bold text-teal-800" role="status">Subiendo adjuntos: {avanceSubida.completados} de {avanceSubida.total}</p>}
                  <button type="button" onClick={() => setCarpetaAbierta(true)} className="mt-2 w-full bg-white border border-teal-300 rounded-xl p-3 text-left text-sm font-bold text-teal-900 hover:bg-teal-50 cursor-pointer">
                    📁 Abrir carpeta de adjuntos ({adjuntos.length + pendientes.length}/{MAX_ADJUNTOS_TRIAJE})
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase">
                    OBSERVACIONES (OPCIONAL)
                  </label>
                  <textarea
                    name="observaciones"
                    rows={2}
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Notas adicionales..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs outline-none focus:border-teal-600 focus:bg-white resize-y"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>🩺</span> {saving ? 'Guardando Triaje...' : 'Guardar Triaje Clínico'}
                </button>
              </form>
            </div>

            {/* COLUMNA DERECHA: HISTORIAL */}
            <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base">📋</div>
                  <div>
                    <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Historial de Triajes</h3>
                    <p className="m-0 text-xs text-slate-400">{triajes.length} registros en total</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar DNI o Nombre..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full sm:w-56 p-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs outline-none"
                />
              </div>
              
              <div className="p-4 flex flex-col gap-3.5 max-h-[750px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500 text-xs">Cargando registros de triaje...</div>
                ) : triajesFiltrados.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="text-3xl mb-2">🩺</div>
                    <p className="m-0 text-slate-700 text-xs font-bold">No hay registros de triaje.</p>
                  </div>
                ) : (
                  triajesFiltrados.map((t, idx) => {
                    const isSelected = form.dni_paciente === t.dni_paciente;
                    return (
                      <div
                        key={t.id || idx}
                        onClick={() => handleSeleccionarHistorial(t)}
                        className={`bg-white rounded-2xl border p-4 flex flex-col gap-2.5 shadow-sm cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20' 
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                              {t.nombre_paciente?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div>
                              <h4 className="m-0 text-sm font-extrabold text-slate-900 uppercase">{t.nombre_paciente}</h4>
                              <span className="text-xs text-slate-500 font-semibold">DNI: {t.dni_paciente}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                              🕒 {t.fecha_hora || 'Hoy'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => ejecutarImpresionTriaje(t, e)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer"
                            >
                              🖨️ Imprimir
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleEliminarTriaje(t.id, e)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-1 rounded-lg text-xs font-extrabold cursor-pointer"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                        {/* SIGNOS PRINCIPALES */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">Edad: {t.edad}a</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">Talla: {t.talla}cm</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">Peso: {t.peso}kg</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">IMC: {t.imc}</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">Pulso: {t.pulso}</span>
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg font-bold">SO2: {t.so2}%</span>
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-extrabold">T°: {t.temperatura}°C</span>
                          {t.presion_arterial && <span className="bg-teal-50 text-teal-900 border border-teal-200 px-2 py-1 rounded-lg font-bold">P/A: {t.presion_arterial}</span>}
                          {t.frecuencia_respiratoria && <span className="bg-teal-50 text-teal-900 border border-teal-200 px-2 py-1 rounded-lg font-bold">F. Resp: {t.frecuencia_respiratoria} rpm</span>}
                        </div>
                        {/* DATOS OPCIONALES RELLENADOS */}
                        {(t.hb || t.glucosa || t.agua_porcentaje || t.grasa_porcentaje || t.grasa_visceral || t.colesterol || t.trigliceridos || t.antecedentes || t.creatinina || t.urea || t.musculo_esqueletico_porcentaje || t.musculos_porcentaje || t.metabolismo || t.proteina || t.edad_metabolica || t.circunferencia_abdominal || t.globulos_rojos || t.globulos_blancos || t.hb_glicosilada || t.vcm || t.tgo || t.tgp || t.t3_t4_tsh) && (
                          <div className="flex flex-wrap gap-1.5 text-xs pt-1 border-t border-slate-100">
                            {t.hb && <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold">HB: {t.hb}</span>}
                            {t.glucosa && <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">Glucosa: {t.glucosa}</span>}
                            {t.agua_porcentaje && <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md font-bold">Agua: {t.agua_porcentaje}</span>}
                            {t.grasa_porcentaje && <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold">Grasa: {t.grasa_porcentaje}</span>}
                            {t.grasa_visceral && <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold">Visceral: {t.grasa_visceral}</span>}
                            {t.musculo_esqueletico_porcentaje && <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">M.Esquel: {t.musculo_esqueletico_porcentaje}</span>}
                            {t.musculos_porcentaje && <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">Músculos: {t.musculos_porcentaje}</span>}
                            {t.metabolismo && <span className="bg-cyan-50 text-cyan-900 border border-cyan-200 px-2 py-0.5 rounded-md font-bold">Metabolismo: {t.metabolismo}</span>}
                            {t.proteina && <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-md font-bold">Proteína: {t.proteina}</span>}
                            {t.edad_metabolica && <span className="bg-cyan-50 text-cyan-900 border border-cyan-200 px-2 py-0.5 rounded-md font-bold">E.Metabólica: {t.edad_metabolica}</span>}
                            {t.circunferencia_abdominal && <span className="bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md font-bold">Circunf: {t.circunferencia_abdominal}</span>}
                            {t.globulos_rojos && <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold">G.Rojos: {t.globulos_rojos}</span>}
                            {t.globulos_blancos && <span className="bg-slate-100 text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md font-bold">G.Blancos: {t.globulos_blancos}</span>}
                            {t.hb_glicosilada && <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">Hb.Glic: {t.hb_glicosilada}</span>}
                            {t.vcm && <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold">VCM: {t.vcm}</span>}
                            {t.colesterol && <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold">Colesterol: {t.colesterol}</span>}
                            {t.trigliceridos && <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold">Triglicéridos: {t.trigliceridos}</span>}
                            {t.creatinina && <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">Creatinina: {t.creatinina}</span>}
                            {t.urea && <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">Urea: {t.urea}</span>}
                            {t.tgo && <span className="bg-yellow-50 text-yellow-900 border border-yellow-200 px-2 py-0.5 rounded-md font-bold">TGO: {t.tgo}</span>}
                            {t.tgp && <span className="bg-yellow-50 text-yellow-900 border border-yellow-200 px-2 py-0.5 rounded-md font-bold">TGP: {t.tgp}</span>}
                            {t.t3_t4_tsh && <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">TSH/T3/T4: {t.t3_t4_tsh}</span>}
                            {t.antecedentes && <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md font-bold">Antecedentes: {t.antecedentes}</span>}
                          </div>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleSeleccionarHistorial(t); setCarpetaAbierta(true); }} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold px-3 py-2 rounded-xl border border-teal-200 cursor-pointer">
                          📁 Abrir carpeta de adjuntos
                        </button>
                        {t.observaciones && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 font-semibold">
                            📝 <strong>Observaciones:</strong> {t.observaciones}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
        {carpetaAbierta && (
          <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={() => setCarpetaAbierta(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4"><h3 className="font-extrabold text-teal-900">📁 Adjuntos del triaje ({adjuntos.length + pendientes.length}/{MAX_ADJUNTOS_TRIAJE})</h3><button type="button" onClick={() => setCarpetaAbierta(false)}>✕</button></div>
              {adjuntos.length + pendientes.length === 0 && <p className="text-sm text-slate-500">Esta carpeta está vacía.</p>}
              <div className="space-y-2">
                {adjuntos.map(item => <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                  <span className="truncate flex-1">{item.tipo.startsWith('image/') ? '🖼️' : '📄'} {item.nombre}</span>
                  <button type="button" className="text-teal-800 font-bold" onClick={() => abrirAdjunto(`/api/triaje/adjuntos/${item.id}`, item.tipo)}>Abrir</button>
                  <button type="button" className="text-rose-700 font-bold" onClick={() => eliminarAdjunto(item.id)}>Eliminar</button>
                </div>)}
                {pendientes.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                  <span className="truncate flex-1">{item.type.startsWith('image/') ? '🖼️' : '📄'} {item.name} · Pendiente de guardar</span>
                  <button type="button" className="text-teal-800 font-bold" onClick={() => abrirAdjunto(URL.createObjectURL(item), item.type)}>Abrir</button>
                  <button type="button" className="text-rose-700 font-bold" onClick={() => setPendientes(prev => prev.filter((_, i) => i !== index))}>Quitar</button>
                </div>)}
              </div>
            </div>
          </div>
        )}
        {/* MODAL PARA VISUALIZAR Y CERRAR */}
        {archivoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold m-0">Vista Ampliada del Archivo / Foto</h3>
                <button
                  type="button"
                  onClick={() => setArchivoModal(null)}
                  className="text-white hover:text-slate-300 font-black text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
                {tipoArchivoModal.startsWith('image/') ? (
                  <img src={archivoModal} alt="Archivo ampliado" className="max-h-[60vh] object-contain rounded-lg shadow-md" />
                ) : (
                  <iframe src={archivoModal} className="w-full h-[60vh] rounded-lg border border-slate-300 bg-white" title="Documento adjunto" />
                )}
              </div>
              <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArchivoModal(null)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  ↩️ Salir / Regresar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function EnfermeriaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando módulo de enfermería...</div>}>
      <EnfermeriaContent />
    </Suspense>
  );
}

