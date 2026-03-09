@echo off
echo =========================================
echo Iniciar Docker y Base de Datos
echo Gestion de Visitas de Promotores
echo =========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo PASO 1: INICIAR DOCKER DESKTOP MANUALMENTE
echo.
echo 1. Busca "Docker Desktop" en el menú de inicio
echo 2. Haz clic para iniciarlo
echo 3. Espera a que el ícono en la bandeja del sistema muestre:
echo    "Docker Desktop is running"
echo.
echo Esto puede tomar 1-2 minutos.
echo.
echo Presiona cualquier tecla CUANDO Docker Desktop esté completamente iniciado...
pause > nul
echo.

echo PASO 2: VERIFICANDO DOCKER...
echo.

:check_docker
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker está funcionando correctamente.
    echo.
    goto :start_postgres
) else (
    echo ❌ Docker no responde.
    echo.
    echo Asegúrate de que:
    echo 1. Docker Desktop esté completamente iniciado
    echo 2. El ícono en la bandeja diga "Docker Desktop is running"
    echo 3. Hayas esperado al menos 2 minutos
    echo.
    echo Presiona cualquier tecla para reintentar...
    pause > nul
    goto :check_docker
)

:start_postgres
echo PASO 3: INICIANDO POSTGRESQL...
echo.

REM Detener cualquier contenedor existente
docker-compose down > nul 2>&1

REM Iniciar PostgreSQL
echo Iniciando PostgreSQL en Docker...
docker-compose up -d postgres

if %errorlevel% neq 0 (
    echo ❌ Error al iniciar PostgreSQL.
    echo.
    echo Posibles soluciones:
    echo 1. Reinicia Docker Desktop
    echo 2. Verifica que Docker tenga permisos
    echo 3. Intenta manualmente: docker-compose up -d postgres
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL iniciado.
echo.
echo Esperando a que PostgreSQL esté listo (10 segundos)...
timeout /t 10 /nobreak > nul

echo Verificando conexión a PostgreSQL...
docker-compose exec postgres pg_isready -U app_user -d gestion_visitas

if %errorlevel% equ 0 (
    echo ✅ PostgreSQL está listo y aceptando conexiones.
    echo.
) else (
    echo ⚠️  PostgreSQL no responde inmediatamente.
    echo Puede necesitar más tiempo para iniciarse.
    echo.
)

echo PASO 4: CREANDO TABLAS DE LA BASE DE DATOS...
echo.
echo Ejecutando migraciones de Prisma...
echo.

npx prisma migrate dev

if %errorlevel% neq 0 (
    echo ❌ Error en las migraciones.
    echo.
    echo Intenta manualmente: npx prisma migrate dev
    echo.
    pause
    exit /b 1
)

echo ✅ Migraciones completadas.
echo.

echo PASO 5: INICIANDO PRISMA STUDIO...
echo.
echo Prisma Studio se iniciará en una nueva ventana.
echo.
echo 📍 URL: http://localhost:5555
echo.

REM Iniciar Prisma Studio en nueva ventana
start "Prisma Studio" cmd /k "npx prisma studio"

echo.
echo =========================================
echo ✅ PROCESO COMPLETADO
echo =========================================
echo.
echo Servicios iniciados:
echo 1. ✅ Docker Desktop
echo 2. ✅ PostgreSQL (Docker)
echo 3. ✅ Base de datos con tablas
echo 4. ✅ Prisma Studio (nueva ventana)
echo.
echo Accesos:
echo - Prisma Studio: http://localhost:5555
echo - PostgreSQL: localhost:5432
echo - Base de datos: gestion_visitas
echo.
echo Ahora puedes usar Prisma Studio en tu navegador.
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul