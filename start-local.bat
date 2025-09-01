@echo off
echo 🚀 Iniciando MSP Dashboard en modo desarrollo...
echo.
echo 📋 Configuración:
echo    - Backend: http://localhost:5001
echo    - Frontend: http://localhost:3001
echo    - Proxy: http://localhost:3001 -> http://localhost:5001
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    echo 📥 Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: npm no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js y npm verificados
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias del servidor...
    npm install
)

if not exist "client/node_modules" (
    echo 📦 Instalando dependencias del cliente...
    cd client
    npm install
    cd ..
)

if not exist "server/node_modules" (
    echo 📦 Instalando dependencias del servidor...
    cd server
    npm install
    cd ..
)

echo ✅ Dependencias verificadas
echo.

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

echo 🎯 Iniciando servidores...
echo.
echo 📊 Backend: Puerto 5001
echo 🌐 Frontend: Puerto 3001
echo 🔗 Proxy: Configurado automáticamente
echo.

REM Iniciar en modo desarrollo
npm run dev

echo.
echo 🛑 Servidores detenidos
pause
