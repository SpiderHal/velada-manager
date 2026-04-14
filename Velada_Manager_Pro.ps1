# Velada_Manager_Pro.ps1
# Script de Arranque Verificado para Velada Manager

$RepoUrl = "https://github.com/SpiderHal/velada-manager"
$ProjectDir = Get-Location

# --- FUNCIONES DE APOYO ---
Function Check-Command($cmd) { return Get-Command $cmd -ErrorAction SilentlyContinue }

Function Refresh-Environment {
    Write-Host "[i] Refrescando variables de entorno..." -ForegroundColor Gray
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Function Wait-For-Port($port) {
    Write-Host "[i] Verificando puerto $port..." -ForegroundColor Gray
    for ($i = 0; $i -lt 15; $i++) {
        if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

Function Ensure-Dependency($name, $cmd, $id) {
    if (-not (Check-Command $cmd)) {
        Write-Host "[!] $name no encontrado. Intentando instalar con winget..." -ForegroundColor Yellow
        
        # Verificar si winget existe
        if (-not (Check-Command "winget")) {
            Write-Host "[X] 'winget' no está disponible. Por favor, instala $name manualmente." -ForegroundColor Red
            Pause; Exit
        }

        # Intentar instalar
        winget install --id $id --silent --accept-package-agreements --accept-source-agreements
        
        # Refrescar path y re-verificar
        Refresh-Environment
        
        if (-not (Check-Command $cmd)) {
            Write-Host "[X] No se pudo instalar $name automáticamente." -ForegroundColor Red
            Write-Host "    Intenta ejecutar este script como ADMINISTRADOR o instala $name manualmente desde su web oficial." -ForegroundColor White
            Pause; Exit
        }
        Write-Host "[OK] $name instalado correctamente." -ForegroundColor Green
    } else {
        Write-Host "[OK] $name detectado." -ForegroundColor Green
    }
}

# --- INICIO DEL SCRIPT ---
Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       VELADA MANAGER - INICIO CONFIRMADO    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 0. Verificar Permisos de Administrador (Necesario para instalaciones)
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[i] El sistema podría solicitar permisos de Administrador para verificar instalaciones." -ForegroundColor Gray
}

# 1. Verificar Dependencias de Sistema
Write-Host "[i] Verificando requisitos del sistema..." -ForegroundColor Gray
Ensure-Dependency "Git" "git" "Git.Git"
Ensure-Dependency "Node.js" "node" "OpenJS.NodeJS.LTS"

# 2. Sincronizar (Si hay internet)
try { 
    Write-Host "[i] Sincronizando con repositorio..." -ForegroundColor Gray
    git pull origin main 
} catch { 
    Write-Host "[!] No se pudo conectar a GitHub, usando version local." -ForegroundColor Yellow 
}

# 3. Verificar node_modules
if (-not (Test-Path "$ProjectDir\server\node_modules")) {
    Write-Host "[!] node_modules no encontrados en server. Instalando..." -ForegroundColor Yellow
    Set-Location "$ProjectDir\server"
    npm install
    Set-Location $ProjectDir
}

if (-not (Test-Path "$ProjectDir\client\node_modules")) {
    Write-Host "[!] node_modules no encontrados en client. Instalando..." -ForegroundColor Yellow
    Set-Location "$ProjectDir\client"
    npm install
    Set-Location $ProjectDir
}

# 4. Asegurar procesos limpios
Write-Host "[i] Limpiando procesos anteriores..." -ForegroundColor Gray
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# 5. Lanzar Servidor (npm start)
Write-Host "[1/2] Iniciando Servidor (Backend)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\server; npm start'" -WindowStyle Minimized

if (-not (Wait-For-Port 3001)) {
    Write-Host "[X] El servidor no inicio. Prueba ejecutar 'npm start' en la carpeta 'server'." -ForegroundColor Red
    Pause; Exit
}

# 6. Lanzar Cliente (npm run dev)
Write-Host "[2/2] Iniciando Cliente (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\client; npm run dev'" -WindowStyle Minimized

if (-not (Wait-For-Port 5173)) {
    Write-Host "[X] El cliente no inicio. Prueba ejecutar 'npm run dev' en la carpeta 'client'." -ForegroundColor Red
    Pause; Exit
}

# 7. Finalizar
Write-Host "`n[OK] ¡Todo funcionando correctamente!" -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SISTEMA ACTIVO (Minimizado en la barra)   " -ForegroundColor White
Write-Host "   Puedes cerrar esta ventana ahora.         " -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Start-Sleep -Seconds 3
Exit
