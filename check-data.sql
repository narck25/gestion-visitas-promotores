-- Verificar datos existentes en la base de datos

-- 1. Conteo de tablas principales
SELECT 'Visit' as table_name, COUNT(*) as total FROM "Visit"
UNION ALL
SELECT 'Client', COUNT(*) FROM "Client"
UNION ALL
SELECT 'User', COUNT(*) FROM "User";

-- 2. Verificar algunos registros de ejemplo
SELECT '=== ÚLTIMAS 5 VISITAS ===' as info;
SELECT id, "promoterId", "clientId", date, status, purpose FROM "Visit" ORDER BY date DESC LIMIT 5;

SELECT '=== ÚLTIMOS 5 CLIENTES ===' as info;
SELECT id, name, "businessName", phone, email, "promoterId" FROM "Client" ORDER BY "createdAt" DESC LIMIT 5;

SELECT '=== TODOS LOS USUARIOS ===' as info;
SELECT id, email, name, role, "isActive" FROM "User" ORDER BY role;