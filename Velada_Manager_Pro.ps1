# Velada_Manager_Pro.ps1
# Script Todo-en-Uno Mejorado para Velada Manager

$RepoUrl = "https://github.com/SpiderHal/velada-manager"
$ProjectDir = Get-Location

Function Check-Command($cmd) {
    return Get-Command $cmd -ErrorAction SilentlyContinue
}

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       VELADA MANAGER - INSTALADOR PRO       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$NeedsRestart = $false

# 1. Verificar Node.js
if (-not (Check-Command "node")) {
    Write-Host "[!] Node.js no detectado. Instalando..." -ForegroundColor Yellow
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    $NeedsRestart = $true
}

# 2. Verificar Git
if (-not (Check-Command "git")) {
    Write-Host "[!] Git no detectado. Instalando..." -ForegroundColor Yellow
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    $NeedsRestart = $true
}

if ($NeedsRestart) {
    Write-Host "`n[IMPORTANTE] Se han instalado componentes criticos." -ForegroundColor Cyan
    Write-Host "POR FAVOR: Cierra esta ventana y vuelve a abrir 'INICIAR_SISTEMA.bat'" -ForegroundColor White
    Write-Host "Esto es necesario para que Windows reconozca Node y Git." -ForegroundColor Yellow
    Pause
    Exit
}

# 3. Actualizar desde GitHub
Write-Host "[i] Sincronizando con GitHub..." -ForegroundColor Gray
try {
    if (Test-Path ".git") {
        git pull origin main
    } else {
        git init
        git remote add origin $RepoUrl
        git fetch
        git checkout -f main
    }
} catch {
    Write-Host "[!] Error al conectar con GitHub. Verifica tu internet." -ForegroundColor Red
}

# 4. Configurar Servidor
Write-Host "`n[1/3] Configurando Servidor..." -ForegroundColor Yellow
if (Test-Path "server") {
    cd "server"
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependencias (esto puede tardar)..." -ForegroundColor Gray
        npm install
    }
    
    # Base de Datos
    if (-not (Test-Path "prisma/dev.db")) {
        Write-Host "Creando base de datos inicial..." -ForegroundColor Gray
        npx prisma migrate dev --name init --skip-generate
        npx prisma generate
        node prisma/seed.js
    }
    cd ..
} else {
    Write-Host "[!] No se encontro la carpeta 'server'." -ForegroundColor Red
    Pause
    Exit
}

# 5. Configurar Cliente
Write-Host "[2/3] Configurando Cliente..." -ForegroundColor Yellow
if (Test-Path "client") {
    cd "client"
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependencias del cliente..." -ForegroundColor Gray
        npm install
    }
    cd ..
}

# 6. Lanzar Sistema
Write-Host "`n[3/3] ¡Todo listo! Lanzando..." -ForegroundColor Green

# Matar procesos anteriores si existen
Stop-Process -Name "node" -ErrorAction SilentlyContinue

Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\server; npm start'" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\client; npm run dev -- --host'" -WindowStyle Hidden

Write-Host "Esperando 8 segundos a que cargue el sistema..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Abrir Navegador
Start-Process "http://localhost:5173"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SISTEMA LISTO EN: http://localhost:5173   " -ForegroundColor Green
Write-Host "   Manten esta ventana abierta para trabajar " -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

# Mantener vivo para ver errores si algo falla despues
Pause
