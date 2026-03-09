@echo off
echo =========================================
echo Esperando a que Docker Desktop esté listo
echo =========================================
echo.

echo Docker Desktop está iniciado pero el motor puede no estar listo.
echo Esperando 30 segundos para que Docker se inicialice completamente...
echo.

timeout /t 30 /nobreak > nul

echo Verificando estado de Docker...
echo.

:check_docker
docker version > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker está funcionando correctamente.
    echo.
    docker version
    echo.
    goto :docker_ready
) else (
    echo ⚠️ Docker aún no está listo. Esperando 10 segundos más...
    timeout /t 10 /nobreak > nul
    goto :check_docker
)

:docker_ready
echo.
echo =========================================
echo Docker está listo para usar.
echo Ahora puedes ejecutar:
echo 1. .\start-postgres.bat  (para iniciar PostgreSQL)
echo 2. npx prisma migrate dev (para crear tablas)
echo 3. npx prisma studio     (para ver la base de datos)
echo =========================================
echo.
echo Presiona cualquier tecla para salir...
pause > nul