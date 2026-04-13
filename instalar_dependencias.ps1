# Script de instalación de dependencias para Velada Manager
$ProjectRoot = Get-Location

Write-Host "--- Instalando dependencias del sistema ---" -ForegroundColor Cyan

Write-Host "`n[1/2] Instalando dependencias del Servidor..." -ForegroundColor Yellow
cd "$ProjectRoot\server"
npm install

Write-Host "`n[2/2] Instalando dependencias del Cliente..." -ForegroundColor Yellow
cd "$ProjectRoot\client"
npm install

Write-Host "`n--- Instalación completada ---" -ForegroundColor Green
Write-Host "Ya puedes cerrar esta ventana y usar 'iniciar_sistema.bat'"
Pause
