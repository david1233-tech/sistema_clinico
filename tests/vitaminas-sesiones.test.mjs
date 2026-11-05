import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/vitaminas-sesiones.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(code, { exports, Date, Map, Array, Number });
const { agruparSesiones } = exports;

test('muestra las vitaminas del mismo guardado en una tarjeta y una visita posterior en otra', () => {
  const grupos = agruparSesiones([
    { id: 3, vitaminaNombre: 'Vitamina C', fechaAplicacion: '2026-11-06T15:30:00.000Z' },
    { id: 2, vitaminaNombre: 'Complejo B', fechaAplicacion: '2026-11-06T15:30:00.000Z' },
    { id: 1, vitaminaNombre: 'Suero', fechaAplicacion: '2026-11-05T15:30:00.000Z' },
  ]);
  assert.equal(grupos.length, 2);
  assert.equal(grupos[0][1].map(item => item.vitaminaNombre).join('|'), 'Vitamina C|Complejo B');
  assert.equal(grupos[1][1].map(item => item.vitaminaNombre).join('|'), 'Suero');
});
