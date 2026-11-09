import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../app/api/reniec/route.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function route(token, fetchMock) {
  const exports = {};
  const context = {
    exports,
    require: () => ({ NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } }),
    process: { env: { RENIEC_API_TOKEN: token } },
    fetch: fetchMock,
    URL,
    AbortSignal,
    console,
  };
  vm.runInNewContext(code, context);
  return exports.GET;
}

test('consulta JSON.pe por POST y arma el nombre completo', async () => {
  let called = false;
  const get = route('token-de-prueba', async (url, options) => {
    called = true;
    assert.equal(url, 'https://api.json.pe/api/dni');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer token-de-prueba');
    assert.equal(JSON.parse(options.body).dni, '12345678');
    return { ok: true, status: 200, json: async () => ({ success: true, data: { nombres: 'ANA MARIA', apellido_paterno: 'PEREZ', apellido_materno: 'SOTO' } }) };
  });
  const result = await get(new Request('https://ejemplo.test/api/reniec?dni=12345678'));
  assert.equal(called, true);
  assert.equal(result.body.nombreCompleto, 'ANA MARIA PEREZ SOTO');
});

test('rechaza DNI incompleto antes de llamar al proveedor', async () => {
  const get = route('token-de-prueba', () => { throw new Error('No debía llamarse'); });
  const result = await get(new Request('https://ejemplo.test/api/reniec?dni=123'));
  assert.equal(result.status, 400);
});

