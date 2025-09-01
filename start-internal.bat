@echo off
echo ========================================
echo    MSP Dashboard - Red Interna
echo ========================================
echo.

echo Detectando IP interna...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)

:found_ip
set IP=%IP: =%
echo IP detectada: %IP%
echo.

echo Configurando proxy del cliente...
echo { > temp_package.json
echo   "name": "msp-dashboard-client", >> temp_package.json
echo   "version": "0.1.0", >> temp_package.json
echo   "private": true, >> temp_package.json
echo   "dependencies": { >> temp_package.json
echo     "@testing-library/jest-dom": "^5.17.0", >> temp_package.json
echo     "@testing-library/react": "^13.4.0", >> temp_package.json
echo     "@testing-library/user-event": "^13.5.0", >> temp_package.json
echo     "react": "^18.2.0", >> temp_package.json
echo     "react-dom": "^18.2.0", >> temp_package.json
echo     "react-scripts": "5.0.1", >> temp_package.json
echo     "recharts": "^2.8.0", >> temp_package.json
echo     "axios": "^1.6.0", >> temp_package.json
echo     "moment": "^2.29.4", >> temp_package.json
echo     "react-datepicker": "^4.25.0", >> temp_package.json
echo     "react-router-dom": "^6.8.0", >> temp_package.json
echo     "lucide-react": "^0.294.0", >> temp_package.json
echo     "tailwindcss": "^3.3.0", >> temp_package.json
echo     "autoprefixer": "^10.4.16", >> temp_package.json
echo     "postcss": "^8.4.31" >> temp_package.json
echo   }, >> temp_package.json
echo   "scripts": { >> temp_package.json
echo     "start": "react-scripts start", >> temp_package.json
echo     "build": "react-scripts build", >> temp_package.json
echo     "test": "react-scripts test", >> temp_package.json
echo     "eject": "react-scripts eject" >> temp_package.json
echo   }, >> temp_package.json
echo   "eslintConfig": { >> temp_package.json
echo     "extends": [ >> temp_package.json
echo       "react-app", >> temp_package.json
echo       "react-app/jest" >> temp_package.json
echo     ] >> temp_package.json
echo   }, >> temp_package.json
echo   "browserslist": { >> temp_package.json
echo     "production": [ >> temp_package.json
echo       ">0.2%", >> temp_package.json
echo       "not dead", >> temp_package.json
echo       "not op_mini all" >> temp_package.json
echo     ], >> temp_package.json
echo     "development": [ >> temp_package.json
echo       "last 1 chrome version", >> temp_package.json
echo       "last 1 firefox version", >> temp_package.json
echo       "last 1 safari version" >> temp_package.json
echo     ] >> temp_package.json
echo   }, >> temp_package.json
echo   "proxy": "http://%IP%:5000" >> temp_package.json
echo } >> temp_package.json

move /y temp_package.json client\package.json >nul
echo Proxy configurado para: http://%IP%:5000
echo.

echo Iniciando servidor y cliente...
echo.
echo URLs de acceso:
echo - Desde tu máquina: http://localhost:3000
echo - Desde red interna: http://%IP%:3000
echo.

start cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
start cmd /k "cd client && npm start"

echo.
echo ========================================
echo    Aplicación iniciada exitosamente!
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul

