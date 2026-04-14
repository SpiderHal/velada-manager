# Velada_Manager_Pro.ps1
# Script de Diagnostico y Arranque para Velada Manager

$RepoUrl = "https://github.com/SpiderHal/velada-manager"
$ProjectDir = Get-Location

Function Check-Command($cmd) { return Get-Command $cmd -ErrorAction SilentlyContinue }

Function Wait-For-Port($port) {
    Write-Host "[i] Esperando a que el puerto $port este activo..." -ForegroundColor Gray
    for ($i = 0; $i -lt 20; $i++) {
        if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       VELADA MANAGER - ARRANQUE SEGURO      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Validar comandos basicos
if (-not (Check-Command "node") -or -not (Check-Command "git")) {
    Write-Host "[!] Node o Git no detectados. Reintenta la instalacion." -ForegroundColor Red
    Pause; Exit
}

# 2. Sincronizar (Opcional si hay red)
try { git pull origin main } catch { Write-Host "[!] No se pudo actualizar desde GitHub, usando version local." -ForegroundColor Yellow }

# 3. Servidor
Write-Host "`n[1/3] Revisando Servidor..." -ForegroundColor Yellow
cd "$ProjectDir\server"
if (-not (Test-Path "node_modules")) { npm install }
if (-not (Test-Path "prisma/dev.db")) {
    Write-Host "Configurando base de datos..." -ForegroundColor Gray
    npx prisma generate
    npx prisma migrate dev --name init --skip-generate
    node prisma/seed.js
}

# 4. Cliente
Write-Host "[2/3] Revisando Cliente..." -ForegroundColor Yellow
cd "$ProjectDir\client"
if (-not (Test-Path "node_modules")) { npm install }

# 5. Lanzar y Verificar
Write-Host "`n[3/3] Iniciando servicios..." -ForegroundColor Green
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Lanzamos el servidor y capturamos errores si los hay
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\server; npm start'" -WindowStyle Hidden
if (-not (Wait-For-Port 3001)) {
    Write-Host "[X] EL SERVIDOR (BACKEND) NO ARRANCO." -ForegroundColor Red
    Write-Host "Prueba ejecutar 'npm start' dentro de la carpeta 'server' para ver el error." -ForegroundColor White
    Pause; Exit
}

# Lanzamos el cliente
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\client; npm run dev -- --host'" -WindowStyle Hidden
if (-not (Wait-For-Port 5173)) {
    Write-Host "[X] EL CLIENTE (VITE) NO ARRANCO." -ForegroundColor Red
    Write-Host "Prueba ejecutar 'npm run dev' dentro de la carpeta 'client' para ver el error." -ForegroundColor White
    Pause; Exit
}

# 6. Todo OK
Write-Host "`n[OK] ¡Todo listo! Abriendo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SISTEMA ACTIVO Y VERIFICADO               " -ForegroundColor White
Write-Host "   Manten esta ventana abierta               " -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Pause
