import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/vitaminas-fecha.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(code, { exports, Date, Intl, Object, Number });

test('la fecha elegida de 2024 se guarda con el día y la hora de Perú', () => {
  const fechaIso = exports.fechaManualIso('2024-06-15T09:30:00');
  assert.equal(fechaIso, '2024-06-15T14:30:00.000Z');
  assert.equal(exports.fechaPeruParaInput(fechaIso), '2024-06-15T09:30:00');
  assert.equal(exports.fechaManualIso(''), null);
});
