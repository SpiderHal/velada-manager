@echo off
setlocal

set "PROJECT_ROOT=%~dp0"

echo --- INICIANDO VELADA MANAGER ---
echo [1/3] Iniciando Servidor...
start /b cmd /c "cd /d %PROJECT_ROOT%server && npm start"

echo [2/3] Iniciando Cliente (Vite)...
start /b cmd /c "cd /d %PROJECT_ROOT%client && npm run dev -- --host"

echo [3/3] Esperando a que el sistema este listo...
timeout /t 5 /nobreak >nul

echo Abriendo navegador en http://localhost:5173...
start http://localhost:5173

echo.
echo ===========================================
echo   VELADA MANAGER ESTA CORRIENDO
echo   No cierres esta ventana mientras uses
echo   el sistema de boletos.
echo ===========================================
echo.
pause
