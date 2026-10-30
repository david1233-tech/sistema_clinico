type ResultadoOCR = { data: { text: string } };
type WorkerOCR = { recognize: (archivo: File) => Promise<ResultadoOCR>; terminate: () => Promise<void> };
type TesseractBrowser = {
  createWorker: (idioma: string, modo: number, opciones: { logger: (avance: { progress?: number }) => void }) => Promise<WorkerOCR>;
};

const URL_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
let carga: Promise<TesseractBrowser> | null = null;

function obtenerTesseract() {
  return (window as Window & { Tesseract?: TesseractBrowser }).Tesseract;
}

function cargarTesseract(): Promise<TesseractBrowser> {
  const disponible = obtenerTesseract();
  if (disponible) return Promise.resolve(disponible);
  if (carga) return carga;
  carga = new Promise<TesseractBrowser>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error('No se pudo cargar el lector de texto. Compruebe la conexión a internet.'));
    }, 30000);
    script.src = URL_TESSERACT;
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      const lector = obtenerTesseract();
      if (lector) resolve(lector);
      else reject(new Error('El lector de texto no está disponible en este navegador.'));
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('No se pudo cargar el lector de texto. Compruebe la conexión a internet.'));
    };
    document.head.appendChild(script);
  }).catch(error => {
    carga = null;
    throw error;
  });
  return carga;
}

export async function reconocerTextoLocal(archivo: File, progreso: (porcentaje: number) => void): Promise<string> {
  const tesseract = await cargarTesseract();
  const worker = await tesseract.createWorker('spa', 1, {
    logger: avance => {
      if (typeof avance.progress === 'number') progreso(Math.round(avance.progress * 100));
    }
  });
  try {
    const resultado = await worker.recognize(archivo);
    return resultado.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

