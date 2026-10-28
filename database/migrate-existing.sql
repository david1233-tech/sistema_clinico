-- Ejecutar una sola vez si ya existen las tablas antiguas citas y pagos.
-- La migración conserva los registros existentes y permite que la app escriba
-- sin depender de un doctor o un usuario de caja concreto.

ALTER TABLE citas
  MODIFY COLUMN paciente_id INT(11) NULL,
  MODIFY COLUMN doctor_id INT(11) NULL,
  ADD COLUMN dni_paciente VARCHAR(20) NULL,
  ADD COLUMN nombre_paciente VARCHAR(150) NULL,
  ADD COLUMN telefono VARCHAR(20) NULL,
  ADD COLUMN fecha DATE NULL,
  ADD COLUMN hora TIME NULL;

ALTER TABLE pagos
  MODIFY COLUMN paciente_id INT(11) NULL,
  MODIFY COLUMN registrado_por INT(11) NULL,
  MODIFY COLUMN metodo_pago VARCHAR(30) NOT NULL;

