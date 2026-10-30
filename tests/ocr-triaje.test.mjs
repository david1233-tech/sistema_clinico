import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extraerDatosTriaje } from '../lib/ocr-triaje.ts';

test('asocia signos vitales y datos opcionales de una ficha impresa', () => {
  const texto = [
    'Paciente: Ana Perez',
    'DNI: 12345678 Edad: 42',
    'Talla: 1.65 m Peso 68.5 IMC 25.2 Pulso 72 SO2 98',
    'Temperatura 36.5 P/A 120/80 F. Respiratoria 18',
    'Grasa% 22.5 G. Visceral 8 M.MusEque% 30 Musculos% 40 Agua% 55',
    'Metabolismo 1450 Proteína 18 Grado Obesidad% +12 Edad Metabólica 35 Circunferencia Abdominal 85',
    'HB 13.5 G. Rojos 4.5 G. Blancos 7500 HB. Glicosilada 5.4 VCM 88 Glucosa 95',
    'Colesterol 180 Triglicéridos 140 Creatinina 0.9 Urea 25 TGO 22 TGP 25 T3-T4-TSH TSH 2.1'
  ].join('\n');
  const datos = extraerDatosTriaje(texto);
  assert.equal(datos.dni_paciente, '12345678');
  assert.equal(datos.nombre_paciente, 'Ana Perez');
  assert.equal(datos.talla, '165');
  assert.equal(datos.peso, '68.5');
  assert.equal(datos.presion_arterial, '120/80');
  assert.equal(datos.grasa_porcentaje, '22.5');
  assert.equal(datos.grasa_visceral, '8');
  assert.equal(datos.musculo_esqueletico_porcentaje, '30');
  assert.equal(datos.musculos_porcentaje, '40');
  assert.equal(datos.agua_porcentaje, '55');
  assert.equal(datos.metabolismo, '1450');
  assert.equal(datos.proteina, '18');
  assert.equal(datos.grado_obesidad_porcentaje, '+12');
  assert.equal(datos.edad_metabolica, '35');
  assert.equal(datos.circunferencia_abdominal, '85');
  assert.equal(datos.frecuencia_respiratoria, '18');
  assert.equal(datos.hb, '13.5');
  assert.equal(datos.globulos_rojos, '4.5');
  assert.equal(datos.globulos_blancos, '7500');
  assert.equal(datos.hb_glicosilada, '5.4');
  assert.equal(datos.vcm, '88');
  assert.equal(datos.glucosa, '95');
  assert.equal(datos.colesterol, '180');
  assert.equal(datos.trigliceridos, '140');
  assert.equal(datos.creatinina, '0.9');
  assert.equal(datos.urea, '25');
  assert.equal(datos.tgo, '22');
  assert.equal(datos.tgp, '25');
  assert.equal(datos.t3_t4_tsh, '2.1');
});

test('no asigna un DNI o un valor clínico sin etiqueta', () => {
  const datos = extraerDatosTriaje('Teléfono 98765432\nHB Glicosilada\nObservación ilegible');
  assert.equal(datos.dni_paciente, undefined);
  assert.equal(datos.hb, undefined);
  assert.equal(datos.hb_glicosilada, undefined);
});

