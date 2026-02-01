@echo off
REM ============================================================================
REM Script de Verificación - Archivos ya limpiados
REM ============================================================================

echo.
echo ========================================
echo    VERIFICACIÓN DE LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Este script verifica que los archivos duplicados ya fueron eliminados.
echo.
echo Archivos que YA NO DEBERÍAN EXISTIR:
echo   - src/routes/visitImageRoutes_corrected.js
echo   - src/routes/visitImageRoutes_final.js
echo   - src/routes/visitImageRoutes_fixed.js
echo   - src/routes/visitImageRoutes_simple.js
echo   - src/config/app_updated.js
echo   - prisma/schema_fixed.prisma
echo.
pause

echo.
echo Verificando archivos duplicados...
echo.

set "ERRORES=0"

REM Verificar duplicados de routes
if exist "src\routes\visitImageRoutes_corrected.js" (
    echo [ERROR] visitImageRoutes_corrected.js AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] visitImageRoutes_corrected.js ELIMINADO
)

if exist "src\routes\visitImageRoutes_final.js" (
    echo [ERROR] visitImageRoutes_final.js AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] visitImageRoutes_final.js ELIMINADO
)

if exist "src\routes\visitImageRoutes_fixed.js" (
    echo [ERROR] visitImageRoutes_fixed.js AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] visitImageRoutes_fixed.js ELIMINADO
)

if exist "src\routes\visitImageRoutes_simple.js" (
    echo [ERROR] visitImageRoutes_simple.js AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] visitImageRoutes_simple.js ELIMINADO
)

REM Verificar duplicado de config
if exist "src\config\app_updated.js" (
    echo [ERROR] app_updated.js AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] app_updated.js ELIMINADO
)

REM Verificar duplicado de prisma
if exist "prisma\schema_fixed.prisma" (
    echo [ERROR] schema_fixed.prisma AÚN EXISTE
    set "ERRORES=1"
) else (
    echo [OK] schema_fixed.prisma ELIMINADO
)

echo.
echo ========================================
echo    RESULTADO DE LA VERIFICACIÓN
echo ========================================
echo.

if "%ERRORES%"=="0" (
    echo ✅ TODOS LOS ARCHIVOS DUPLICADOS FUERON ELIMINADOS
    echo.
    echo El proyecto está COMPLETAMENTE LIMPIO y listo para commits.
) else (
    echo ⚠️ ALGUNOS ARCHIVOS DUPLICADOS AÚN EXISTEN
    echo.
    echo Ejecuta cleanup.bat para eliminarlos automáticamente.
)

echo.
echo ========================================
echo    PRÓXIMOS PASOS PARA COMMITS
echo ========================================
echo.
echo 1. Verificar estado de git:
echo    git status
echo.
echo 2. Asegúrate que .env NO aparezca en la lista
echo    (debe estar ignorado por .gitignore)
echo.
echo 3. Agregar archivos al staging:
echo    git add .
echo.
echo 4. Verificar cambios:
echo    git status
echo    git diff --staged
echo.
echo 5. Hacer commit:
echo    git commit -m "feat: configuracion inicial del proyecto"
echo.
echo 6. Push al repositorio:
echo    git push origin main
echo.
pause
