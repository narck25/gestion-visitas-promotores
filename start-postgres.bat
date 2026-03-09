@echo off
echo =========================================
echo Iniciando PostgreSQL con Docker Compose
echo Gestion de Visitas de Promotores
echo =========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo Verificando si Docker Desktop está corriendo...
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop no está corriendo.
    echo Por favor, inicia Docker Desktop manualmente.
    echo.
    pause
    exit /b 1
)

echo Docker Desktop está corriendo.
echo.
echo Iniciando PostgreSQL en Docker...
echo.

REM Iniciar solo el servicio de PostgreSQL
docker-compose up -d postgres

echo.
echo ✅ PostgreSQL iniciado en Docker.
echo 📍 Puerto: localhost:5432
echo 📍 Base de datos: gestion_visitas
echo 📍 Usuario: app_user
echo.
echo Esperando a que PostgreSQL esté listo...
echo.

REM Esperar a que PostgreSQL esté listo
timeout /t 10 /nobreak > nul

echo Verificando conexión a PostgreSQL...
docker-compose exec postgres pg_isready -U app_user -d gestion_visitas

if %errorlevel% equ 0 (
    echo.
    echo ✅ PostgreSQL está listo y aceptando conexiones.
    echo.
    echo Ahora puedes ejecutar:
    echo 1. npx prisma migrate dev
    echo 2. npx prisma studio
    echo 3. npm run dev (servidor con base de datos)
    echo.
) else (
    echo.
    echo ⚠️  PostgreSQL no responde correctamente.
    echo Intenta esperar unos segundos más.
    echo.
)

echo Esta ventana se puede cerrar.
echo Presiona cualquier tecla para salir...
pause > nul