# Velada_Manager_Pro.ps1
# Script Todo-en-Uno para Velada Manager

$RepoUrl = "https://github.com/SpiderHal/velada-manager"
$ProjectDir = Get-Location

Function Check-Command($cmd) {
    return Get-Command $cmd -ErrorAction SilentlyContinue
}

Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       VELADA MANAGER - SISTEMA AUTO        " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Verificar Node.js
if (-not (Check-Command "node")) {
    Write-Host "[!] Node.js no detectado. Instalando automaticamente..." -ForegroundColor Yellow
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Write-Host "[OK] Node.js instalado. Es posible que debas reiniciar el script." -ForegroundColor Green
}

# 2. Verificar Git
if (-not (Check-Command "git")) {
    Write-Host "[!] Git no detectado. Instalando automaticamente..." -ForegroundColor Yellow
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    Write-Host "[OK] Git instalado." -ForegroundColor Green
}

# 3. Actualizar desde GitHub
if (Test-Path ".git") {
    Write-Host "[i] Buscando actualizaciones en GitHub..." -ForegroundColor Gray
    git pull origin main
} else {
    Write-Host "[!] Repositorio no vinculado. Configurando..." -ForegroundColor Yellow
    git init
    git remote add origin $RepoUrl
    git fetch
    git checkout -f main
}

# 4. Configurar Servidor
Write-Host "`n[1/3] Revisando Servidor (Backend)..." -ForegroundColor Yellow
cd "$ProjectDir\server"
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del servidor..." -ForegroundColor Gray
    npm install
}

# Base de datos: Si no existe, la crea
if (-not (Test-Path "prisma/dev.db")) {
    Write-Host "Configurando base de datos inicial..." -ForegroundColor Gray
    npx prisma migrate dev --name init
    node prisma/seed.js
}

# 5. Configurar Cliente
Write-Host "[2/3] Revisando Cliente (Frontend)..." -ForegroundColor Yellow
cd "$ProjectDir\client"
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias del cliente..." -ForegroundColor Gray
    npm install
}

# 6. Lanzar Sistema
Write-Host "`n[3/3] ¡Todo listo! Iniciando servicios..." -ForegroundColor Green

# Iniciar procesos en segundo plano
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\server; npm start'" -WindowStyle Hidden
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectDir\client; npm run dev -- --host'" -WindowStyle Hidden

Write-Host "Esperando a que los motores arranquen (8 seg)..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Abrir Navegador
Start-Process "http://localhost:5173"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   SISTEMA EN LINEA Y LISTO PARA TRABAJAR    " -ForegroundColor Green
Write-Host "   No cierres esta ventana mientras lo uses  " -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan

Pause
