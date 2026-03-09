Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Iniciando servidor backend" -ForegroundColor Cyan
Write-Host "Gestion de Visitas de Promotores" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script
Set-Location -Path $PSScriptRoot

# Verificar si el puerto 3001 está en uso
Write-Host "Verificando estado del puerto 3001..." -ForegroundColor Yellow

try {
    # Intentar liberar el puerto si está en uso
    npx kill-port 3001 2>$null
    Write-Host "Puerto 3001 liberado." -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "No se pudo liberar el puerto automáticamente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Iniciando servidor backend en nueva ventana..." -ForegroundColor Green
Write-Host ""

# Crear un script temporal para la nueva ventana
$tempScript = @"
Set-Location -Path '$PSScriptRoot'
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host 'Servidor Backend - Gestion de Visitas' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "Directorio: \$PWD" -ForegroundColor Yellow
Write-Host 'Comando: npm run dev' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Presiona Ctrl+C para detener el servidor' -ForegroundColor Magenta
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host ''
npm run dev
"@

# Guardar script temporal
$tempScriptPath = Join-Path $env:TEMP "start-backend-temp.ps1"
$tempScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

# Iniciar nueva ventana
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$tempScriptPath`"" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidor backend iniciado en una nueva ventana." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3001" -ForegroundColor Green
Write-Host "📍 Health Check: http://localhost:3001/health" -ForegroundColor Green
Write-Host "📍 Endpoint Visitas: POST http://localhost:3001/api/visits" -ForegroundColor Green
Write-Host ""
Write-Host "Esta ventana se puede cerrar." -ForegroundColor Gray
Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
Read-Host