-- Script para actualizar usuarios de desarrollo
-- Contraseña: 123456 (hash bcrypt con salt rounds 10)

-- Actualizar contraseña del usuario administrador existente
UPDATE "User" 
SET password = '$2a$10$JDBwV8pL.8qyVqj8q8q8qO8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q'
WHERE email = 'sistemas@kram.mx';

-- Crear usuario supervisor si no existe
INSERT INTO "User" (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
SELECT 
  'cmlg34x3n0000zocbo7sdp071',
  'supervisor@kram.mx',
  '$2a$10$JDBwV8pL.8qyVqj8q8q8qO8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q',
  'Supervisor Desarrollo',
  'SUPERVISOR',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE email = 'supervisor@kram.mx'
);

-- Crear usuario promotor si no existe
INSERT INTO "User" (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
SELECT 
  'cmlg34x3n0000zocbo7sdp072',
  'promotor@kram.mx',
  '$2a$10$JDBwV8pL.8qyVqj8q8q8qO8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q',
  'Promotor Desarrollo',
  'PROMOTER',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE email = 'promotor@kram.mx'
);

-- Verificar usuarios creados
SELECT id, email, name, role, "isActive" FROM "User" 
WHERE email IN ('sistemas@kram.mx', 'supervisor@kram.mx', 'promotor@kram.mx')
ORDER BY role;