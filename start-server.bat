@echo off
echo =========================================
echo Iniciando servidor backend
echo Gestion de Visitas de Promotores
echo =========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar si el puerto 3001 está en uso
echo Verificando estado del puerto 3001...
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    echo El puerto 3001 esta en uso.
    echo Intentando liberar el puerto...
    npx kill-port 3001
    timeout /t 2 /nobreak > nul
) else (
    echo Puerto 3001 disponible.
)

echo.
echo Iniciando servidor backend en nueva ventana...
echo.

REM Iniciar el servidor en una nueva ventana de terminal
start "Backend Gestion Visitas" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ✅ Servidor backend iniciado en una nueva ventana.
echo 📍 URL: http://localhost:3001
echo 📍 Health Check: http://localhost:3001/health
echo 📍 Endpoint Visitas: POST http://localhost:3001/api/visits
echo.
echo Esta ventana se puede cerrar.
echo Presiona cualquier tecla para salir...
pause > nul