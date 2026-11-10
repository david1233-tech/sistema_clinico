type DatosConsultaPdf = {
  paciente: string;
  dni: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  receta: string;
  dieta: string;
};

// PDF de texto sin dependencias externas. Helvetica usa la codificación WinAnsi.
const pdfTexto = (texto: string) => texto
  .normalize('NFC')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');

const escapar = (texto: string) => pdfTexto(texto).replace(/([\\()])/g, '\\$1');

function lineas(texto: string, ancho = 94): string[] {
  return String(texto || 'Sin registrar').replace(/\r/g, '').split('\n').flatMap(parrafo => {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    if (!palabras.length) return [''];
    const resultado: string[] = [];
    let linea = '';
    for (const palabra of palabras) {
      const partes = palabra.match(new RegExp(`.{1,${ancho}}`, 'g')) || [''];
      for (const parte of partes) {
        if (linea && `${linea} ${parte}`.length > ancho) { resultado.push(linea); linea = ''; }
        linea = linea ? `${linea} ${parte}` : parte;
      }
    }
    resultado.push(linea);
    return resultado;
  });
}

export function crearPdfConsulta(datos: DatosConsultaPdf): Uint8Array {
  const paginas: string[][] = [[]];
  const agregar = (valor: string, estilo: 'titulo' | 'seccion' | 'normal' = 'normal') => {
    const ultima = paginas[paginas.length - 1];
    if (ultima.length >= 49) paginas.push([]);
    paginas[paginas.length - 1].push(`${estilo}|${valor}`);
  };
  agregar('CENTRO DE REHABILITACION NATURAL VITAL SALUD SAC', 'titulo');
  agregar('FICHA DE CONSULTORIO', 'titulo');
  agregar(`Paciente: ${datos.paciente}   DNI: ${datos.dni}`);
  agregar(`Fecha y hora: ${datos.fecha}`);
  for (const [titulo, valor] of [
    ['MOTIVO DE CONSULTA Y SINTOMAS', datos.motivo],
    ['DIAGNOSTICO CLINICO', datos.diagnostico],
    ['PRESCRIPCION / RECETA MEDICA', datos.receta],
    ['DIETA Y PLAN NUTRICIONAL', datos.dieta],
  ]) {
    agregar('');
    agregar(titulo, 'seccion');
    lineas(valor).forEach(linea => agregar(linea));
  }

  const objetos: string[] = ['', '', '', ''];
  objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  const referencias: number[] = [];
  paginas.forEach((pagina, indice) => {
    const idPagina = 4 + indice * 2;
    const idContenido = idPagina + 1;
    referencias.push(idPagina);
    let y = 785;
    const comandos = pagina.map(linea => {
      const separador = linea.indexOf('|');
      const estilo = linea.slice(0, separador);
      const contenido = linea.slice(separador + 1);
      const tamano = estilo === 'titulo' ? 12 : estilo === 'seccion' ? 11 : 9;
      const comando = `BT /F1 ${tamano} Tf 42 ${y} Td (${escapar(contenido)}) Tj ET`;
      y -= estilo === 'titulo' ? 20 : estilo === 'seccion' ? 17 : 13;
      return comando;
    }).join('\n');
    objetos[idPagina] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${idContenido} 0 R >>`;
    objetos[idContenido] = `<< /Length ${comandos.length} >>\nstream\n${comandos}\nendstream`;
  });
  objetos[2] = `<< /Type /Pages /Kids [${referencias.map(id => `${id} 0 R`).join(' ')}] /Count ${referencias.length} >>`;
  let salida = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objetos.length; id++) {
    offsets[id] = salida.length;
    salida += `${id} 0 obj\n${objetos[id]}\nendobj\n`;
  }
  const inicioXref = salida.length;
  salida += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objetos.length; id++) salida += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  salida += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  return Uint8Array.from(salida, char => char.charCodeAt(0));
}
