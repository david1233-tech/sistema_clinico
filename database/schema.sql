-- Ejecutar una vez en la base MySQL configurada en Vercel.
-- CREATE TABLE IF NOT EXISTS conserva datos y tablas existentes.

CREATE TABLE IF NOT EXISTS pacientes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dni CHAR(8) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  telefono VARCHAR(30) NULL,
  edad SMALLINT UNSIGNED NULL,
  genero VARCHAR(30) NULL,
  direccion VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS triaje (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dni_paciente CHAR(8) NOT NULL,
  nombre_paciente VARCHAR(200) NOT NULL,
  edad SMALLINT UNSIGNED NULL,
  talla DECIMAL(6,2) NULL,
  peso DECIMAL(6,2) NULL,
  imc DECIMAL(6,2) NULL,
  pulso VARCHAR(30) NULL,
  so2 VARCHAR(30) NULL,
  temperatura VARCHAR(30) NULL,
  hb VARCHAR(30) NULL,
  presion VARCHAR(30) NULL,
  observaciones TEXT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (dni_paciente)
);

CREATE TABLE IF NOT EXISTS pagos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paciente_id BIGINT UNSIGNED NULL,
  registrado_por BIGINT UNSIGNED NULL,
  dni_paciente CHAR(8) NOT NULL,
  nombre_paciente VARCHAR(200) NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  tipo_ingreso VARCHAR(60) NOT NULL,
  destinatario_pago VARCHAR(20) NOT NULL,
  metodo_pago VARCHAR(60) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (dni_paciente)
);

CREATE TABLE IF NOT EXISTS consultas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dni_paciente CHAR(8) NOT NULL,
  fecha VARCHAR(40) NOT NULL,
  motivo TEXT NULL,
  diagnostico TEXT NULL,
  receta LONGTEXT NULL,
  dieta LONGTEXT NULL,
  imagen_url LONGTEXT NULL,
  INDEX (dni_paciente)
);

CREATE TABLE IF NOT EXISTS citas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paciente_id BIGINT UNSIGNED NULL,
  doctor_id BIGINT UNSIGNED NULL,
  dni_paciente CHAR(8) NOT NULL,
  nombre_paciente VARCHAR(200) NOT NULL,
  telefono VARCHAR(30) NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  fecha_hora_cita DATETIME NOT NULL,
  motivo TEXT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programada',
  INDEX (dni_paciente),
  INDEX (fecha)
);

CREATE TABLE IF NOT EXISTS internamientos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dni_paciente CHAR(8) NOT NULL,
  nombre_paciente VARCHAR(200) NOT NULL,
  cama VARCHAR(50) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  tiempo_estancia_num SMALLINT UNSIGNED NULL,
  tiempo_estancia_unidad VARCHAR(20) NULL,
  fecha_estimada_salida DATE NULL,
  diagnostico TEXT NULL,
  observaciones TEXT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'hospitalizado',
  fecha_salida DATE NULL,
  hora_salida TIME NULL,
  motivo_salida TEXT NULL,
  notas_salida TEXT NULL,
  INDEX (dni_paciente)
);

CREATE TABLE IF NOT EXISTS recetas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dni_paciente CHAR(8) NOT NULL,
  nombre_paciente VARCHAR(200) NOT NULL,
  vitaminaNombre VARCHAR(200) NOT NULL,
  dosis VARCHAR(100) NULL,
  via VARCHAR(100) NULL,
  observaciones TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fechaAplicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (dni_paciente)
);

