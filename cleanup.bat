@echo off
REM ============================================================================
REM Script de Limpieza - Eliminar archivos duplicados
REM ============================================================================

echo.
echo ========================================
echo    SCRIPT DE LIMPIEZA DEL PROYECTO
echo ========================================
echo.
echo Este script eliminara los archivos duplicados detectados.
echo.
echo Archivos a eliminar:
echo   - src/routes/visitImageRoutes_corrected.js
echo   - src/routes/visitImageRoutes_final.js
echo   - src/routes/visitImageRoutes_fixed.js
echo   - src/routes/visitImageRoutes_simple.js
echo   - src/config/app_updated.js
echo   - prisma/schema_fixed.prisma
echo.
pause

echo.
echo Eliminando archivos duplicados...
echo.

REM Eliminar duplicados de routes
if exist "src\routes\visitImageRoutes_corrected.js" (
    del "src\routes\visitImageRoutes_corrected.js"
    echo [OK] Eliminado: visitImageRoutes_corrected.js
)

if exist "src\routes\visitImageRoutes_final.js" (
    del "src\routes\visitImageRoutes_final.js"
    echo [OK] Eliminado: visitImageRoutes_final.js
)

if exist "src\routes\visitImageRoutes_fixed.js" (
    del "src\routes\visitImageRoutes_fixed.js"
    echo [OK] Eliminado: visitImageRoutes_fixed.js
)

if exist "src\routes\visitImageRoutes_simple.js" (
    del "src\routes\visitImageRoutes_simple.js"
    echo [OK] Eliminado: visitImageRoutes_simple.js
)

REM Eliminar duplicado de config
if exist "src\config\app_updated.js" (
    del "src\config\app_updated.js"
    echo [OK] Eliminado: app_updated.js
)

REM Eliminar duplicado de prisma
if exist "prisma\schema_fixed.prisma" (
    del "prisma\schema_fixed.prisma"
    echo [OK] Eliminado: schema_fixed.prisma
)

echo.
echo ========================================
echo    LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Proximos pasos:
echo   1. Ejecuta: git status
echo   2. Verifica que .env NO aparezca en la lista
echo   3. Ejecuta: git add .
echo   4. Ejecuta: git status (verificar cambios)
echo   5. Ejecuta: git commit -m "feat: configuracion inicial del proyecto"
echo   6. Ejecuta: git push origin main
echo.
pause
