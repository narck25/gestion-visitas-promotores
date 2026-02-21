-- Actualizar contraseñas con hash bcrypt correcto para "123456"
-- Hash: $2a$10$kJg2jN1rvPy96IntX4COQuCnlUC3pSDCtcQ74p1L2QzfYY5nY52ha

-- Actualizar contraseña del usuario administrador
UPDATE "User" 
SET password = '$2a$10$kJg2jN1rvPy96IntX4COQuCnlUC3pSDCtcQ74p1L2QzfYY5nY52ha'
WHERE email = 'sistemas@kram.mx';

-- Actualizar contraseña del usuario supervisor
UPDATE "User" 
SET password = '$2a$10$kJg2jN1rvPy96IntX4COQuCnlUC3pSDCtcQ74p1L2QzfYY5nY52ha'
WHERE email = 'supervisor@kram.mx';

-- Actualizar contraseña del usuario promotor
UPDATE "User" 
SET password = '$2a$10$kJg2jN1rvPy96IntX4COQuCnlUC3pSDCtcQ74p1L2QzfYY5nY52ha'
WHERE email = 'promotor@kram.mx';

-- Verificar usuarios actualizados
SELECT id, email, name, role, "isActive" FROM "User" 
WHERE email IN ('sistemas@kram.mx', 'supervisor@kram.mx', 'promotor@kram.mx')
ORDER BY role;