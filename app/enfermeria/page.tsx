'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { extraerDatosTriaje } from '@/lib/ocr-triaje';
import { reconocerTextoLocal } from '@/lib/ocr-navegador';

interface Triaje {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  fecha_hora?: string;
  fecha?: string;
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
const CAMPOS_DETALLE: { campo: keyof Triaje; etiqueta: string }[] = [
  { campo: 'edad', etiqueta: 'Edad' }, { campo: 'talla', etiqueta: 'Talla (cm)' },
  { campo: 'peso', etiqueta: 'Peso (kg)' }, { campo: 'imc', etiqueta: 'IMC' },
  { campo: 'pulso', etiqueta: 'Pulso' }, { campo: 'so2', etiqueta: 'SO2 (%)' },
  { campo: 'temperatura', etiqueta: 'Temperatura (°C)' },
  { campo: 'presion_arterial', etiqueta: 'P/A (mmHg)' },
  { campo: 'frecuencia_respiratoria', etiqueta: 'F. respiratoria (rpm)' },
  { campo: 'hb', etiqueta: 'Hemoglobina (HB)' }, { campo: 'glucosa', etiqueta: 'Glucosa' },
  { campo: 'agua_porcentaje', etiqueta: 'Agua (%)' }, { campo: 'grasa_porcentaje', etiqueta: 'Grasa (%)' },
  { campo: 'grasa_visceral', etiqueta: 'Grasa visceral' },
  { campo: 'musculo_esqueletico_porcentaje', etiqueta: 'Músculo esquelético (%)' },
  { campo: 'musculos_porcentaje', etiqueta: 'Músculos (%)' },
  { campo: 'metabolismo', etiqueta: 'Metabolismo' }, { campo: 'proteina', etiqueta: 'Proteína' },
  { campo: 'grado_obesidad_porcentaje', etiqueta: 'Grado de obesidad (%)' },
  { campo: 'edad_metabolica', etiqueta: 'Edad metabólica' },
  { campo: 'circunferencia_abdominal', etiqueta: 'Circunferencia abdominal' },
  { campo: 'globulos_rojos', etiqueta: 'Glóbulos rojos' },
  { campo: 'globulos_blancos', etiqueta: 'Glóbulos blancos' },
  { campo: 'hb_glicosilada', etiqueta: 'Hb. glicosilada' }, { campo: 'vcm', etiqueta: 'VCM' },
  { campo: 'colesterol', etiqueta: 'Colesterol' }, { campo: 'trigliceridos', etiqueta: 'Triglicéridos' },
  { campo: 'creatinina', etiqueta: 'Creatinina' }, { campo: 'urea', etiqueta: 'Urea' },
  { campo: 'tgo', etiqueta: 'TGO' }, { campo: 'tgp', etiqueta: 'TGP' },
  { campo: 't3_t4_tsh', etiqueta: 'T3-T4-TSH' },
  { campo: 'examenes_solicitados', etiqueta: 'Exámenes solicitados' },
  { campo: 'antecedentes', etiqueta: 'Antecedentes' },
  { campo: 'observaciones', etiqueta: 'Observaciones' }
];

const DATOS_OPCIONALES_ORDENADOS = [
  { campo: 'grasa_porcentaje', etiqueta: 'Grasa %', ejemplo: 'Ej: 22%' },
  { campo: 'grasa_visceral', etiqueta: 'G. Visceral', ejemplo: 'Ej: 8' },
  { campo: 'musculo_esqueletico_porcentaje', etiqueta: 'M.MusEque%', ejemplo: 'Ej: 30%' },
  { campo: 'musculos_porcentaje', etiqueta: 'Músculos%', ejemplo: 'Ej: 40%' },
  { campo: 'agua_porcentaje', etiqueta: 'Agua %', ejemplo: 'Ej: 55%' },
  { campo: 'metabolismo', etiqueta: 'Metabolismo', ejemplo: 'Ej: 1450 kcal' },
  { campo: 'proteina', etiqueta: 'Proteína', ejemplo: 'Ej: 18%' },
  { campo: 'grado_obesidad_porcentaje', etiqueta: 'Grado de Obesidad%', ejemplo: 'Ej: +12%' },
  { campo: 'edad_metabolica', etiqueta: 'Edad Metabólica', ejemplo: 'Ej: 32 años' },
  { campo: 'circunferencia_abdominal', etiqueta: 'Circunferencia Abdominal', ejemplo: 'Ej: 85 cm' },
  { campo: 'frecuencia_respiratoria', etiqueta: 'F. Respiratoria (rpm)', ejemplo: 'Ej: 18' },
  { campo: 'hb', etiqueta: 'HB', ejemplo: 'Ej: 13.5' },
  { campo: 'globulos_rojos', etiqueta: 'G. Rojos', ejemplo: 'Ej: 4.5 mill' },
  { campo: 'globulos_blancos', etiqueta: 'G. Blancos', ejemplo: 'Ej: 7500' },
  { campo: 'hb_glicosilada', etiqueta: 'HB. Glicosilada', ejemplo: 'Ej: 5.4%' },
  { campo: 'vcm', etiqueta: 'VCM', ejemplo: 'Ej: 88 fL' },
  { campo: 'glucosa', etiqueta: 'Glucosa', ejemplo: 'Ej: 95 mg/dL' },
  { campo: 'colesterol', etiqueta: 'Colesterol', ejemplo: 'Ej: 180 mg/dL' },
  { campo: 'trigliceridos', etiqueta: 'Triglicéridos', ejemplo: 'Ej: 140 mg/dL' },
  { campo: 'creatinina', etiqueta: 'Creatinina', ejemplo: 'Ej: 0.9 mg/dL' },
  { campo: 'urea', etiqueta: 'Urea', ejemplo: 'Ej: 25 mg/dL' },
  { campo: 'tgo', etiqueta: 'TGO', ejemplo: 'Ej: 22 U/L' },
  { campo: 'tgp', etiqueta: 'TGP', ejemplo: 'Ej: 25 U/L' },
  { campo: 't3_t4_tsh', etiqueta: 'T3-T4-TSH', ejemplo: 'Ej: TSH 2.1' },
] as const;

function crearFormularioTriaje(dni_paciente = '', nombre_paciente = '', edad = '') {
  return {
    dni_paciente, nombre_paciente, edad,
    talla: '', peso: '', imc: '', pulso: '', so2: '', temperatura: '', hb: '',
    agua_porcentaje: '', grasa_porcentaje: '', grasa_visceral: '',
    musculo_esqueletico_porcentaje: '', musculos_porcentaje: '', metabolismo: '',
    proteina: '', grado_obesidad_porcentaje: '', edad_metabolica: '',
    circunferencia_abdominal: '', presion_arterial: '', frecuencia_respiratoria: '',
    glucosa: '', globulos_rojos: '', globulos_blancos: '', hb_glicosilada: '',
    vcm: '', colesterol: '', trigliceridos: '', creatinina: '', urea: '',
    tgo: '', tgp: '', t3_t4_tsh: '', examenes_solicitados: '',
    antecedentes: '', observaciones: '', archivo_adjunto: ''
  };
}

function formularioDesdeRegistro(registro: Triaje) {
  const formulario = crearFormularioTriaje();
  for (const campo of Object.keys(formulario) as (keyof typeof formulario)[]) {
    const valor = registro[campo];
    formulario[campo] = valor === null || valor === undefined ? '' : String(valor);
  }
  return formulario;
}

function fechaTriaje(t: Triaje) {
  const fecha = t.fecha || t.fecha_hora;
  if (!fecha) return `Registro #${t.id}`;
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? fecha : parsed.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

async function prepararFoto(archivo: File, ladoMaximo = 1800): Promise<File> {
  if (archivo.size <= 3 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) return archivo;
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();
    const canvas = document.createElement('canvas');
    for (let intento = 0; intento < 3; intento++) {
      const escala = Math.min(1, ladoMaximo / Math.max(imagen.naturalWidth, imagen.naturalHeight));
      canvas.width = Math.round(imagen.naturalWidth * escala);
      canvas.height = Math.round(imagen.naturalHeight * escala);
      canvas.getContext('2d')?.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      for (const calidad of [0.88, 0.72, 0.55]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad));
        if (blob && blob.size <= 3 * 1024 * 1024) return new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
      ladoMaximo = Math.round(ladoMaximo * 0.8);
    }
    throw new Error('La foto es demasiado grande. Intente con menor resolución.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

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
  const [dniHistorial, setDniHistorial] = useState<string | null>(null);
  const [detalleTriaje, setDetalleTriaje] = useState<Triaje | null>(null);
  const [adjuntosDetalle, setAdjuntosDetalle] = useState<Adjunto[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [registroPendienteId, setRegistroPendienteId] = useState<string | number | null>(null);
  const [registroEditando, setRegistroEditando] = useState<Triaje | null>(null);
  
  const [triajeImprimir, setTriajeImprimir] = useState<Triaje | null>(null);
  const [archivoModal, setArchivoModal] = useState<string | null>(null);
  const [tipoArchivoModal, setTipoArchivoModal] = useState('');
  const [carpetaAbierta, setCarpetaAbierta] = useState(false);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [pendientes, setPendientes] = useState<File[]>([]);
  const [avanceSubida, setAvanceSubida] = useState<{ completados: number; total: number } | null>(null);
  const camaraAdjuntoRef = useRef<HTMLInputElement | null>(null);
  const camaraHistorialRef = useRef<HTMLInputElement | null>(null);
  const [leyendoHistorial, setLeyendoHistorial] = useState(false);
  const [mensajeLectura, setMensajeLectura] = useState('');
  const [textoVisibleHistorial, setTextoVisibleHistorial] = useState('');
  const [zoomImagen, setZoomImagen] = useState(1);
  const distanciaDedosRef = useRef<{ distancia: number; zoom: number } | null>(null);
  const detalleRequestRef = useRef(0);
  const adjuntosRequestRef = useRef(0);
  const [form, setForm] = useState(crearFormularioTriaje);

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

  const leerFotoHistorial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const seleccion = e.target.files?.[0];
    e.target.value = '';
    if (!seleccion) return;
    setLeyendoHistorial(true);
    setMensajeLectura('Leyendo foto del historial...');
    setTextoVisibleHistorial('');
    try {
      const archivo = await prepararFoto(seleccion, 2600);
      const textoVisible = await reconocerTextoLocal(archivo, porcentaje => setMensajeLectura(`Reconociendo texto en este teléfono... ${porcentaje}%`));
      const campos = extraerDatosTriaje(textoVisible);
      setTextoVisibleHistorial(textoVisible);
      if (form.dni_paciente && campos.dni_paciente && form.dni_paciente !== campos.dni_paciente) {
        throw new Error('El DNI de la foto no coincide con el paciente seleccionado. Revise la foto antes de continuar.');
      }
      if (form.dni_paciente) {
        delete campos.dni_paciente;
        if (form.nombre_paciente) delete campos.nombre_paciente;
      }
      if (registroEditando || registroPendienteId) delete campos.dni_paciente;
      const reconocidos = Object.keys(campos).length;
      if (!reconocidos) {
        setMensajeLectura(textoVisible ? 'Se encontró texto visible, pero no se pudo asociar a campos con seguridad. Revíselo abajo y complete los datos manualmente.' : 'No se distinguieron datos para completar el formulario. Puede intentar con otra foto o ingresar los datos manualmente.');
        return;
      }
      setForm(prev => ({ ...prev, ...campos }));
      setMensajeLectura(`${reconocidos} datos completados. Revise cada valor antes de guardar${textoVisible ? ' y consulte el texto adicional de la foto.' : '.'}`);
    } catch (error) {
      setMensajeLectura(error instanceof Error ? error.message : 'No se pudo leer la foto.');
    } finally {
      setLeyendoHistorial(false);
    }
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
    if (registroEditando) return;
    if (!/^\d{8}$/.test(dni)) return;
    try {
      setBuscandoDni(true);
      const triajeExistente = triajes.find(t => t.dni_paciente === dni);
      const enc = pacientesRegistrados.find(p => (p.dni || p.dni_paciente) === dni);
      if (enc || triajeExistente) {
        const nombre = enc?.nombre || enc?.nombre_paciente || triajeExistente?.nombre_paciente || '';
        const edad = enc?.edad || triajeExistente?.edad;
        setForm(prev => prev.dni_paciente === dni
          ? { ...prev, nombre_paciente: nombre || prev.nombre_paciente, edad: edad ? String(edad) : prev.edad }
          : crearFormularioTriaje(dni, nombre, edad ? String(edad) : ''));
      } else {
        const res = await fetch('/api/pacientes');
        if (res.ok) {
          const todos = await res.json();
          if (Array.isArray(todos)) {
            const encontrado = todos.find(p => (p.dni || p.dni_paciente) === dni);
            if (encontrado) {
              setForm(prev => prev.dni_paciente === dni
                ? { ...prev, nombre_paciente: encontrado.nombre || encontrado.nombre_paciente || prev.nombre_paciente, edad: encontrado.edad ? String(encontrado.edad) : prev.edad }
                : crearFormularioTriaje(dni, encontrado.nombre || encontrado.nombre_paciente || '', encontrado.edad ? String(encontrado.edad) : ''));
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
    if (registroPendienteId || registroEditando) return;
    const dniElegido = e.target.value;
    if (!dniElegido) {
      adjuntosRequestRef.current += 1;
      setAdjuntos([]);
      setPendientes([]);
      setRegistroPendienteId(null);
      setForm(crearFormularioTriaje());
      return;
    }
    const triajeExistente = triajes.find(t => t.dni_paciente === dniElegido);
    const paciente = pacientesRegistrados.find(p => (p.dni === dniElegido || p.dni_paciente === dniElegido));
    adjuntosRequestRef.current += 1;
    setAdjuntos([]);
    setPendientes([]);
    setRegistroPendienteId(null);
    setForm(crearFormularioTriaje(
      dniElegido,
      paciente?.nombre || paciente?.nombre_paciente || triajeExistente?.nombre_paciente || '',
      paciente?.edad || triajeExistente?.edad ? String(paciente?.edad || triajeExistente?.edad) : ''
    ));
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

  const handleFotoTriaje = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const seleccion = e.target.files?.[0];
    e.target.value = '';
    if (!seleccion) return;
    if (adjuntos.length + pendientes.length >= MAX_ADJUNTOS_TRIAJE) {
      alert('Se permiten hasta 200 adjuntos por triaje.');
      return;
    }
    try {
      const foto = await prepararFoto(seleccion);
      setPendientes(prev => [...prev, foto]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo preparar la foto.');
    }
  };

  const cargarAdjuntos = async (id: string | number) => {
    const solicitud = ++adjuntosRequestRef.current;
    const res = await fetch(`/api/triaje/adjuntos?id=${id}`);
    if (!res.ok) throw new Error('No se pudieron cargar los adjuntos del registro');
    const items = await res.json();
    if (solicitud === adjuntosRequestRef.current) setAdjuntos(items);
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
    setZoomImagen(1);
    setArchivoModal(url);
  };

  const eliminarAdjunto = async (id: number) => {
    if (!confirm('¿Eliminar este adjunto guardado?')) return;
    const res = await fetch(`/api/triaje/adjuntos?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAdjuntos(prev => prev.filter(item => item.id !== id));
    else alert('No se pudo eliminar el adjunto.');
  };

  const abrirDetalleTriaje = async (t: Triaje) => {
    const solicitud = ++detalleRequestRef.current;
    setDetalleTriaje(t);
    setAdjuntosDetalle([]);
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/triaje/adjuntos?id=${t.id}`);
      if (!res.ok) throw new Error('No se pudieron cargar los adjuntos del registro');
      const items = await res.json();
      if (solicitud === detalleRequestRef.current) setAdjuntosDetalle(items);
    } catch (error) {
      if (solicitud === detalleRequestRef.current) alert(error instanceof Error ? error.message : 'No se pudieron cargar los adjuntos');
    } finally {
      if (solicitud === detalleRequestRef.current) setCargandoDetalle(false);
    }
  };

  const volverARegistros = () => {
    detalleRequestRef.current += 1;
    setDetalleTriaje(null);
  };

  const cerrarRegistros = () => {
    volverARegistros();
    setDniHistorial(null);
  };

  const iniciarEdicion = async (registro: Triaje) => {
    if (saving) return;
    if (registroPendienteId) {
      alert('Termine de subir los adjuntos pendientes antes de editar otro registro.');
      return;
    }
    const hayDatosSinGuardar = pendientes.length > 0 || Object.entries(form).some(([campo, valor]) =>
      !['dni_paciente', 'nombre_paciente', 'edad', 'archivo_adjunto'].includes(campo) && Boolean(valor)
    );
    if (hayDatosSinGuardar && !confirm('Los cambios que aún no guardó en el formulario se perderán. ¿Continuar?')) return;
    cerrarRegistros();
    setRegistroEditando(registro);
    setRegistroPendienteId(null);
    setForm(formularioDesdeRegistro(registro));
    setPendientes([]);
    setAdjuntos([]);
    setCarpetaAbierta(false);
    setMostrarOpcionales(true);
    try { await cargarAdjuntos(registro.id); }
    catch (error) { alert(error instanceof Error ? error.message : 'No se pudieron cargar los adjuntos'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    if (!registroEditando) return;
    adjuntosRequestRef.current += 1;
    setForm(crearFormularioTriaje(
      registroEditando.dni_paciente,
      registroEditando.nombre_paciente,
      registroEditando.edad === null || registroEditando.edad === undefined ? '' : String(registroEditando.edad)
    ));
    setRegistroEditando(null);
    setAdjuntos([]);
    setPendientes([]);
    setCarpetaAbierta(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'dni_paciente') {
      if (registroPendienteId) return;
      if (registroEditando) {
        setForm(prev => ({ ...prev, dni_paciente: value }));
        return;
      }
      setForm(prev => prev.dni_paciente === value ? prev : crearFormularioTriaje(value));
      adjuntosRequestRef.current += 1;
      setAdjuntos([]);
      setPendientes([]);
      setRegistroPendienteId(null);
      cargarDatosPacientePorDni(value);
    } else if (name === 'peso' || name === 'imc') {
      setForm(prev => ({ ...prev, [name]: value.replace(/,/g, '.') }));
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
      let id = registroEditando?.id || registroPendienteId;
      if (registroEditando) {
        const res = await fetch('/api/triaje', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, id: registroEditando.id })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'No se pudo actualizar el registro');
      } else if (!id) {
        const res = await fetch('/api/triaje', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error((await res.json()).error || 'No se pudo guardar el triaje');
        const creado = await res.json();
        id = creado.data.id;
        setRegistroPendienteId(id);
      }
      if (!id) throw new Error('No se recibió el identificador del triaje');
      await subirPendientes(id);
      await fetchTriajes();
      setForm(crearFormularioTriaje(form.dni_paciente, form.nombre_paciente, form.edad));
      setAdjuntos([]);
      setPendientes([]);
      setRegistroPendienteId(null);
      setRegistroEditando(null);
      alert(registroEditando ? '📋 Registro de triaje corregido. Los demás registros se conservaron.' : '📋 Nuevo registro de triaje guardado. Los registros anteriores se conservaron.');
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
        if (detalleTriaje?.id === id) volverARegistros();
        if (registroEditando?.id === id) cancelarEdicion();
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

  const historialAgrupado = Array.from(triajes.reduce((grupos, triaje) => {
    const registros = grupos.get(triaje.dni_paciente) || [];
    registros.push(triaje);
    grupos.set(triaje.dni_paciente, registros);
    return grupos;
  }, new Map<string, Triaje[]>()).values()).filter(registros =>
    registros[0].nombre_paciente.toLowerCase().includes(filtro.toLowerCase()) ||
    registros[0].dni_paciente.includes(filtro)
  );
  const registrosPaciente = triajes.filter(t => t.dni_paciente === dniHistorial);

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
                📅 Fecha y Hora: {fechaTriaje(triajeImprimir)}
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
                  <h3 className="m-0 text-sm md:text-base font-extrabold text-white">{registroEditando ? `Editando registro del ${fechaTriaje(registroEditando)}` : 'Nuevo Triaje Clínico'}</h3>
                  <p className="m-0 text-xs text-teal-100">{registroEditando ? `Registro #${registroEditando.id} · Los demás registros se conservarán` : 'Los campos con (*) son obligatorios'}</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <p className="m-0 text-[11px] font-extrabold text-sky-900 uppercase">📸 Leer historial con la cámara</p>
                  <p className="text-xs text-sky-800 my-2">Tome una foto de la ficha clínica. El texto se lee en este teléfono, sin usar saldo de OpenAI. La primera lectura descarga el lector y puede tardar un poco.</p>
                  <input ref={camaraHistorialRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={leerFotoHistorial} className="hidden" aria-label="Foto del historial" />
                  <button type="button" onClick={() => camaraHistorialRef.current?.click()} disabled={saving || leyendoHistorial} className="px-3 py-2 bg-sky-800 text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer">
                    {leyendoHistorial ? 'Leyendo foto...' : '📸 Tomar foto del historial'}
                  </button>
                  {mensajeLectura && <p role="status" className="text-xs text-sky-900 mt-2 mb-0">{mensajeLectura}</p>}
                  {textoVisibleHistorial && <details className="mt-2 text-xs text-sky-900"><summary className="cursor-pointer font-bold">Ver texto reconocido de la foto</summary><p className="whitespace-pre-wrap break-words mt-1 mb-0">{textoVisibleHistorial}</p></details>}
                </div>
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                  <label className="block text-[11px] font-extrabold text-teal-900 mb-1 uppercase tracking-wider">
                    👤 SELECCIONAR PACIENTE REGISTRADO EN RECEPCIÓN
                  </label>
                  <select
                    onChange={handleSelectPaciente}
                    value={form.dni_paciente}
                    disabled={saving || Boolean(registroPendienteId) || Boolean(registroEditando)}
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
                      disabled={saving || Boolean(registroPendienteId)}
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
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]+([.][0-9]{1,2})?"
                        title="Ingrese el peso con punto decimal, por ejemplo 68.5"
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
                        inputMode="decimal"
                        pattern="[0-9]+([.][0-9]{1,2})?"
                        title="Ingrese el IMC manualmente, por ejemplo 24.5"
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
                  <div className="grid grid-cols-2 gap-2.5 mt-2.5">
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
                  </div>
                </div>
                <p className="m-0 text-xs text-teal-800 font-semibold">
                  {registroEditando ? 'Los cambios se guardarán únicamente en este registro. Puede añadir o quitar sus adjuntos desde la carpeta.' : registroPendienteId ? 'El registro ya se creó. Termine de subir los adjuntos pendientes con el botón de abajo.' : 'Cada guardado crea un registro nuevo para este paciente y conserva los anteriores.'}
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-xs flex justify-between items-center transition-all cursor-pointer border border-slate-300 mt-1"
                >
                  <span>{mostrarOpcionales ? '▼ Ocultar Datos Opcionales y Exámenes' : '▶ Mostrar Datos Opcionales y Exámenes'}</span>
                  <span className="bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Ver más</span>
                </button>
                {mostrarOpcionales && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 animate-fadeIn text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DATOS_OPCIONALES_ORDENADOS.map(({ campo, etiqueta, ejemplo }) => (
                        <label key={campo} className="block min-w-0">
                          <span className="block text-[10px] font-bold text-slate-700 mb-1">{etiqueta}</span>
                          <input
                            type={campo === 'hb' || campo === 'frecuencia_respiratoria' ? 'number' : 'text'}
                            step={campo === 'hb' ? '0.1' : undefined}
                            min={campo === 'frecuencia_respiratoria' ? '1' : undefined}
                            name={campo}
                            value={form[campo]}
                            onChange={handleChange}
                            placeholder={ejemplo}
                            className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                          />
                        </label>
                      ))}
                    </div>
                    <label className="block mt-3">
                      <span className="block text-[10px] font-bold text-slate-700 mb-1">Antecedentes médicos</span>
                      <input type="text" name="antecedentes" value={form.antecedentes} onChange={handleChange} placeholder="Ej: Hipertensión, diabetes..." className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-xs" />
                    </label>
                  </div>
                )}
                <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-200">
                  <label className="block text-[11px] font-extrabold text-teal-900 mb-2 uppercase tracking-wider">
                    📁 FOTOS Y ARCHIVOS DEL TRIAJE
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input ref={camaraAdjuntoRef} type="file" accept="image/*" capture="environment" onChange={handleFotoTriaje} disabled={saving} className="hidden" aria-label="Foto de triaje" />
                    <button
                      type="button"
                      onClick={() => camaraAdjuntoRef.current?.click()}
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
                  <span>🩺</span> {saving ? 'Guardando triaje...' : registroEditando ? 'Guardar cambios de este registro' : registroPendienteId ? 'Reintentar adjuntos pendientes' : 'Guardar nuevo registro de triaje'}
                </button>
                {registroEditando && <button type="button" onClick={cancelarEdicion} disabled={saving} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer">Cancelar edición y volver a nuevo registro</button>}
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
                ) : historialAgrupado.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="text-3xl mb-2">🩺</div>
                    <p className="m-0 text-slate-700 text-xs font-bold">No hay registros de triaje.</p>
                  </div>
                ) : (
                  historialAgrupado.map((registros, idx) => {
                    const t = registros[0];
                    const isSelected = form.dni_paciente === t.dni_paciente;
                    return (
                      <div
                        key={t.id || idx}
                        onClick={() => { setDniHistorial(t.dni_paciente); volverARegistros(); }}
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
                              🕒 {fechaTriaje(t)}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setDniHistorial(t.dni_paciente); volverARegistros(); }}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer"
                            >
                              📋 Ver registros ({registros.length})
                            </button>
                            <button type="button" onClick={() => iniciarEdicion(t)} className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer">✏️ Editar último</button>
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
                              🗑️ Eliminar último
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
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDniHistorial(t.dni_paciente); abrirDetalleTriaje(t); }} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 font-extrabold px-3 py-2 rounded-xl border border-teal-200 cursor-pointer">
                          📁 Ver datos y adjuntos del último registro
                        </button>
                        {t.observaciones && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 font-semibold line-clamp-2">
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
        {dniHistorial && (
          <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true" aria-label="Registros de triaje del paciente" onClick={cerrarRegistros}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="m-0 text-base font-extrabold text-teal-900">📋 Registros de triaje</h3>
                  <p className="m-0 text-xs text-slate-600">{registrosPaciente[0]?.nombre_paciente || 'Paciente'} · DNI {dniHistorial} · {registrosPaciente.length} {registrosPaciente.length === 1 ? 'registro' : 'registros'}</p>
                </div>
                <button type="button" onClick={cerrarRegistros} className="text-slate-700 font-bold cursor-pointer" aria-label="Cerrar registros">✕</button>
              </div>
              {detalleTriaje ? (
                <div className="space-y-4">
                  <button type="button" onClick={volverARegistros} className="text-xs font-bold text-teal-800 cursor-pointer">← Volver a todos los registros</button>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="m-0 text-sm font-extrabold text-slate-900">Registro del {fechaTriaje(detalleTriaje)}</h4>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => iniciarEdicion(detalleTriaje)} className="bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">✏️ Editar este registro</button>
                      <button type="button" onClick={e => ejecutarImpresionTriaje(detalleTriaje, e)} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">🖨️ Imprimir</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CAMPOS_DETALLE.filter(({ campo }) => detalleTriaje[campo] !== null && detalleTriaje[campo] !== undefined && detalleTriaje[campo] !== '').map(({ campo, etiqueta }) => (
                      <div key={campo} className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs break-words">
                        <span className="font-bold text-slate-600">{etiqueta}:</span> <span className="text-slate-900">{String(detalleTriaje[campo])}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-teal-900 mb-2">📁 Fotos y archivos de este registro ({adjuntosDetalle.length})</h4>
                    {cargandoDetalle ? <p className="text-xs text-slate-500">Cargando adjuntos...</p> : adjuntosDetalle.length === 0 ? <p className="text-xs text-slate-500">Este registro no tiene adjuntos.</p> : (
                      <div className="space-y-2">
                        {adjuntosDetalle.map(item => <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg text-xs">
                          <span className="truncate flex-1">{item.tipo.startsWith('image/') ? '🖼️' : '📄'} {item.nombre}</span>
                          <button type="button" onClick={() => abrirAdjunto(`/api/triaje/adjuntos/${item.id}`, item.tipo)} className="font-bold text-teal-800 cursor-pointer">Abrir</button>
                        </div>)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrosPaciente.map((registro, index) => <div key={registro.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="m-0 text-sm font-bold text-slate-900">{index === 0 ? 'Último registro' : `Registro anterior ${index}`} · {fechaTriaje(registro)}</p>
                      <p className="m-0 text-xs text-slate-600">Peso: {registro.peso || '-'} kg · IMC: {registro.imc || '-'} · P/A: {registro.presion_arterial || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => abrirDetalleTriaje(registro)} className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Ver datos y adjuntos</button>
                      <button type="button" onClick={() => iniciarEdicion(registro)} className="bg-amber-50 text-amber-900 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Editar</button>
                      <button type="button" onClick={e => ejecutarImpresionTriaje(registro, e)} className="bg-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Imprimir</button>
                      <button type="button" onClick={e => handleEliminarTriaje(registro.id, e)} className="bg-rose-50 text-rose-700 px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer">Eliminar</button>
                    </div>
                  </div>)}
                  {registrosPaciente.length === 0 && <p className="text-sm text-slate-500">No hay registros para este paciente.</p>}
                </div>
              )}
            </div>
          </div>
        )}
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
              
              <div className="p-4 flex-1 overflow-auto bg-slate-100" style={{ touchAction: 'pan-x pan-y' }}
                onTouchStart={e => {
                  if (e.touches.length === 2) distanciaDedosRef.current = {
                    distancia: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY),
                    zoom: zoomImagen
                  };
                }}
                onTouchMove={e => {
                  if (e.touches.length !== 2 || !distanciaDedosRef.current || !tipoArchivoModal.startsWith('image/')) return;
                  e.preventDefault();
                  const distancia = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                  setZoomImagen(Math.min(5, Math.max(1, distanciaDedosRef.current.zoom * distancia / distanciaDedosRef.current.distancia)));
                }}
                onTouchEnd={() => { distanciaDedosRef.current = null; }}>
                {tipoArchivoModal.startsWith('image/') ? (
                  <img src={archivoModal} alt="Archivo ampliado" draggable={false} style={{ width: `${zoomImagen * 100}%`, maxWidth: 'none' }} className="h-auto object-contain rounded-lg shadow-md select-none" />
                ) : (
                  <iframe src={archivoModal} className="w-full h-[60vh] rounded-lg border border-slate-300 bg-white" title="Documento adjunto" />
                )}
              </div>
              <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-end gap-3">
                {tipoArchivoModal.startsWith('image/') && <div className="flex items-center gap-2 mr-auto text-xs text-slate-700">
                  <button type="button" onClick={() => setZoomImagen(z => Math.max(1, z - 0.5))} className="px-2 py-1 rounded bg-slate-100 font-bold" aria-label="Reducir imagen">−</button>
                  <span>{Math.round(zoomImagen * 100)}%</span>
                  <button type="button" onClick={() => setZoomImagen(z => Math.min(5, z + 0.5))} className="px-2 py-1 rounded bg-slate-100 font-bold" aria-label="Ampliar imagen">+</button>
                </div>}
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

