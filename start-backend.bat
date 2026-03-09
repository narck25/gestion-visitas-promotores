@echo off
echo Iniciando servidor backend en consola independiente...
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar si el puerto 3001 está en uso
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    echo El puerto 3001 ya está en uso.
    echo Intentando liberar el puerto...
    npx kill-port 3001
    timeout /t 2 /nobreak > nul
)

REM Iniciar el servidor en una nueva ventana de terminal
echo Iniciando servidor backend en puerto 3001...
echo.
start "Backend Gestion Visitas" cmd /k "npm run dev"

echo.
echo Servidor backend iniciado en una nueva ventana.
echo Puedes cerrar esta ventana.
echo.
pause