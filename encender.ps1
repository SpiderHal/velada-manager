# Script de inicio para Velada Manager
$ProjectRoot = "C:\Users\bond_\Proyectos\velada-manager"

Write-Host "--- Iniciando Velada Manager ---" -ForegroundColor Cyan

# 1. Iniciar el Servidor (Backend)
Write-Host "[1/3] Iniciando Servidor en puerto 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectRoot\server; npm start'" -WindowStyle Hidden

# 2. Iniciar el Cliente (Frontend)
Write-Host "[2/3] Iniciando Cliente Vite..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile -Command 'cd $ProjectRoot\client; npm run dev'" -WindowStyle Hidden

# 3. Esperar un momento a que los servicios levanten
Write-Host "Esperando a que los servicios estén listos..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 4. Abrir el Navegador
Write-Host "[3/3] ¡Todo listo! Abriendo el sistema..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`nPresiona cualquier tecla para cerrar esta ventana (los servicios seguirán corriendo en segundo plano)." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
