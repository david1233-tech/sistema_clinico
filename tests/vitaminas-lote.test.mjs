import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function prepararApi({ fallarEnInsercion = 0 } = {}) {
  const operaciones = [];
  const guardados = [];
  let pendientes = [];
  let inserciones = 0;
  const cliente = {
    async query(sql, params) {
      if (sql === 'BEGIN') { operaciones.push('BEGIN'); pendientes = []; return { rows: [] }; }
      if (sql === 'COMMIT') { operaciones.push('COMMIT'); guardados.push(...pendientes); return { rows: [] }; }
      if (sql === 'ROLLBACK') { operaciones.push('ROLLBACK'); pendientes = []; return { rows: [] }; }
      inserciones += 1;
      if (inserciones === fallarEnInsercion) throw Object.assign(new Error('Inserción fallida'), { code: '23514' });
      pendientes.push(params);
      return { rows: [{ id: inserciones, fechaAplicacion: params[6] }] };
    },
    release() { operaciones.push('RELEASE'); }
  };
  const pgPool = {
    async query(sql) {
      if (sql.includes('information_schema.columns')) {
        return { rows: ['vitaminanombre', 'fechaaplicacion'].map(column_name => ({ column_name })) };
      }
      return { rows: [] };
    },
    async connect() { return cliente; }
  };
  const source = readFileSync(new URL('../app/api/vitaminas/route.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, status: init?.status || 200 }) } };
      if (name === '@/lib/db') return { pgPool, pool: {} };
      throw new Error(`Importación inesperada: ${name}`);
    },
    console: { error() {} }, Date, URL
  });
  return { POST: exports.POST, operaciones, guardados };
}

const solicitud = () => new Request('https://example.test/api/vitaminas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dni_paciente: '12345678',
    nombre_paciente: 'Paciente',
    tratamientos: Array.from({ length: 5 }, (_, indice) => ({
      vitaminaNombre: `Vitamina ${indice + 1}`,
      dosis: `${indice + 1} ampolla(s)`, via: indice % 2 ? 'Intramuscular' : 'Intravenosa', observaciones: `Producto ${indice + 1}`
    }))
  })
});

test('guarda cinco vitaminas juntas con la misma fecha y hora', async () => {
  const api = prepararApi();
  const respuesta = await api.POST(solicitud());
  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.data.length, 5);
  assert.deepEqual(api.operaciones, ['BEGIN', 'COMMIT', 'RELEASE']);
  assert.equal(api.guardados.length, 5);
  assert.equal(new Set(api.guardados.map(params => params[6].getTime())).size, 1);
  assert.deepEqual(api.guardados.map(params => params[3]), ['1 ampolla(s)', '2 ampolla(s)', '3 ampolla(s)', '4 ampolla(s)', '5 ampolla(s)']);
  assert.deepEqual(api.guardados.map(params => params[4]), ['Intravenosa', 'Intramuscular', 'Intravenosa', 'Intramuscular', 'Intravenosa']);
});

test('revierte todo el lote si falla una de las vitaminas', async () => {
  const api = prepararApi({ fallarEnInsercion: 3 });
  const respuesta = await api.POST(solicitud());
  assert.equal(respuesta.status, 503);
  assert.deepEqual(api.operaciones, ['BEGIN', 'ROLLBACK', 'RELEASE']);
  assert.equal(api.guardados.length, 0);
});
