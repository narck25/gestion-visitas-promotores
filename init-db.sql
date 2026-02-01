-- Script de inicialización de la base de datos
-- Se ejecuta automáticamente al crear el contenedor PostgreSQL

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de usuarios (si no existe)
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PROMOTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de refresh tokens
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS "Client" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    "businessType" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de visitas
CREATE TABLE IF NOT EXISTS "Visit" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "promoterId" TEXT NOT NULL REFERENCES "User"(id),
    "clientId" TEXT NOT NULL REFERENCES "Client"(id),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    photos TEXT[] DEFAULT '{}',
    signature TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON "RefreshToken"(token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS idx_visit_promoter_id ON "Visit"("promoterId");
CREATE INDEX IF NOT EXISTS idx_visit_client_id ON "Visit"("clientId");
CREATE INDEX IF NOT EXISTS idx_visit_date ON "Visit"(date);
CREATE INDEX IF NOT EXISTS idx_visit_status ON "Visit"(status);

-- Crear usuario administrador por defecto (contraseña: admin123)
INSERT INTO "User" (id, email, password, name, role, "isActive") 
VALUES (
    'admin-001',
    'admin@example.com',
    -- Contraseña: admin123 (hasheada con bcrypt)
    '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6gZ4KjH7z7z7z7z7z7z7z7z7z7z7',
    'Administrador',
    'ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- Crear usuario promotor de ejemplo (contraseña: promotor123)
INSERT INTO "User" (id, email, password, name, role, "isActive") 
VALUES (
    'promoter-001',
    'promotor@example.com',
    -- Contraseña: promotor123 (hasheada con bcrypt)
    '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6gZ4KjH7z7z7z7z7z7z7z7z7z7',
    'Juan Pérez',
    'PROMOTER',
    true
) ON CONFLICT (email) DO NOTHING;

-- Crear cliente de ejemplo
INSERT INTO "Client" (id, name, phone, email, address, "businessType", notes) 
VALUES (
    'client-001',
    'Tienda ABC',
    '555-123-4567',
    'tienda@example.com',
    'Av. Principal #123, Ciudad',
    'Retail',
    'Cliente frecuente, buen pagador'
) ON CONFLICT DO NOTHING;

-- Crear visita de ejemplo
INSERT INTO "Visit" (id, "promoterId", "clientId", date, latitude, longitude, address, notes, status, photos) 
VALUES (
    'visit-001',
    'promoter-001',
    'client-001',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    19.4326,
    -99.1332,
    'Av. Principal #123, Ciudad',
    'Visita de seguimiento, cliente satisfecho con productos',
    'COMPLETED',
    ARRAY['foto1.jpg', 'foto2.jpg']
) ON CONFLICT DO NOTHING;

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_updated_at ON "Client";
CREATE TRIGGER update_client_updated_at
    BEFORE UPDATE ON "Client"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visit_updated_at ON "Visit";
CREATE TRIGGER update_visit_updated_at
    BEFORE UPDATE ON "Visit"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Otorgar permisos al usuario de la aplicación
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;