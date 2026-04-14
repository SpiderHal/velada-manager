# Velada_Manager_Pro.ps1
# Script de Arranque Verificado para Velada Manager

$RepoUrl = "https://github.com/SpiderHal/velada-manager"
$ProjectDir = Get-Location

Function Check-Command($cmd) { return Get-Command $cmd -ErrorAction SilentlyContinue }

Function Wait-For-Port($port) {
    Write-Host "[i] Verificando puerto $port..." -ForegroundColor Gray
    for ($i = 0; $i -lt 15; $i++) {
        if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       VELADA MANAGER - INICIO CONFIRMADO    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Sincronizar (Si hay internet)
try { git pull origin main } catch { Write-Host "[!] No se pudo conectar a GitHub, usando version local." -ForegroundColor Yellow }

# 2. Asegurar procesos limpios
Write-Host "[i] Limpiando procesos anteriores..." -ForegroundColor Gray
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# 3. Lanzar Servidor (npm start)
Write-Host "[1/2] Iniciando Servidor (Backend)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\server; npm start'" -WindowStyle Minimized

if (-not (Wait-For-Port 3001)) {
    Write-Host "[X] El servidor no inicio. Prueba ejecutar 'npm start' en la carpeta 'server'." -ForegroundColor Red
    Pause; Exit
}

# 4. Lanzar Cliente (npm run dev)
Write-Host "[2/2] Iniciando Cliente (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\client; npm run dev'" -WindowStyle Minimized

if (-not (Wait-For-Port 5173)) {
    Write-Host "[X] El cliente no inicio. Prueba ejecutar 'npm run dev' en la carpeta 'client'." -ForegroundColor Red
    Pause; Exit
}

# 5. Finalizar
Write-Host "`n[OK] ¡Todo funcionando correctamente!" -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SISTEMA ACTIVO (Minimizado en la barra)   " -ForegroundColor White
Write-Host "   Puedes cerrar esta ventana ahora.         " -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3
Exit
