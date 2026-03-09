Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor backend" -ForegroundColor Cyan
Write-Host "Gestion de Visitas de Promotores" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script
Set-Location -Path $PSScriptRoot

# Verificar si el puerto 3001 está en uso
Write-Host "Verificando estado del puerto 3001..." -ForegroundColor Yellow
$portInUse = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue

if ($portInUse.TcpTestSucceeded) {
    Write-Host "El puerto 3001 está en uso. Intentando liberarlo..." -ForegroundColor Yellow
    
    try {
        # Intentar usar kill-port si está disponible
        npx kill-port 3001 2>$null
        Write-Host "Puerto liberado exitosamente." -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "No se pudo liberar el puerto automáticamente." -ForegroundColor Red
        Write-Host "Por favor, cierra manualmente cualquier proceso usando el puerto 3001." -ForegroundColor Red
    }
} else {
    Write-Host "Puerto 3001 disponible." -ForegroundColor Green
}

Write-Host ""
Write-Host "Iniciando servidor backend..." -ForegroundColor Green
Write-Host ""

# Iniciar el servidor en una nueva ventana
$scriptBlock = {
    Set-Location -Path $using:PSScriptRoot
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Servidor Backend - Gestion de Visitas" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Directorio: $PWD" -ForegroundColor Yellow
    Write-Host "Comando: npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Magenta
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    npm run dev
}

# Crear una nueva ventana de PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {$scriptBlock}" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidor backend iniciado en una nueva ventana." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3001" -ForegroundColor Green
Write-Host "📍 Health Check: http://localhost:3001/health" -ForegroundColor Green
Write-Host "📍 Endpoint Visitas: POST http://localhost:3001/api/visits" -ForegroundColor Green
Write-Host ""
Write-Host "Esta ventana se puede cerrar." -ForegroundColor Gray
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
