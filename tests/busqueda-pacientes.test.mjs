import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/busqueda-pacientes.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(code, { exports });
const { coincideBusquedaPaciente, coincideInicialApellido } = exports;

test('una letra filtra por primer apellido, no por el nombre', () => {
  assert.equal(coincideBusquedaPaciente('Ana Pérez Soto', '12345678', 'A'), false);
  assert.equal(coincideBusquedaPaciente('María Álvarez Soto', '87654321', 'A'), true);
  assert.equal(coincideInicialApellido('María Álvarez Soto', 'A'), true);
  assert.equal(coincideInicialApellido('Ana Pérez Soto', 'A'), false);
});

test('permite buscar por DNI y nombre completo', () => {
  assert.equal(coincideBusquedaPaciente('María Álvarez Soto', '87654321', '8765'), true);
  assert.equal(coincideBusquedaPaciente('María Álvarez Soto', '87654321', 'María'), true);
});
