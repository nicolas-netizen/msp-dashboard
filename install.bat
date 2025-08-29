@echo off
echo ========================================
echo    Instalando MSP Dashboard
echo ========================================
echo.

echo Instalando dependencias del servidor...
npm install

echo.
echo Instalando dependencias del cliente...
cd client
npm install
cd ..

echo.
echo ========================================
echo    Instalacion completada!
echo ========================================
echo.
echo Para ejecutar el dashboard:
echo 1. Copia env.example a .env
echo 2. Configura tu API key en .env
echo 3. Ejecuta: npm run dev
echo.
echo El dashboard estara disponible en:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
pause

