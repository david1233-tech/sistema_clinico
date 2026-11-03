import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allows, createSession, readSession } from '../lib/auth.ts';

test('el operador solo puede abrir sus cuatro módulos', () => {
  for (const path of ['/recepcion', '/enfermeria', '/agenda', '/vitaminas']) {
    assert.equal(allows('operador', path, 'GET'), true, path);
  }
  for (const path of ['/dashboard', '/consultorio', '/internados', '/caja', '/admin', '/triaje']) {
    assert.equal(allows('operador', path, 'GET'), false, path);
  }
});

test('el operador solo puede usar las API necesarias para esos módulos', () => {
  for (const path of ['/api/pacientes', '/api/triaje', '/api/triaje/adjuntos', '/api/citas', '/api/vitaminas']) {
    assert.equal(allows('operador', path, 'POST'), true, path);
  }
  for (const path of ['/api/consulta', '/api/consulta/adjuntos', '/api/recetas', '/api/reniec']) {
    assert.equal(allows('operador', path, 'GET'), true, path);
    assert.equal(allows('operador', path, 'POST'), false, path);
  }
  for (const path of ['/api/dashboard', '/api/caja', '/api/internados', '/api/admin']) {
    assert.equal(allows('operador', path, 'GET'), false, path);
  }
});

test('la sesión firmada conserva el rol limitado', () => {
  const secret = 'clave-de-prueba-para-sesion';
  const token = createSession('operador', secret);
  assert.equal(readSession(token, secret)?.role, 'operador');
  assert.equal(readSession(token, 'otra-clave'), null);
});
