#!/bin/bash

echo "🚀 Iniciando MSP Dashboard en modo desarrollo..."
echo ""
echo "📋 Configuración:"
echo "   - Backend: http://localhost:5001"
echo "   - Frontend: http://localhost:3001"
echo "   - Proxy: http://localhost:3001 -> http://localhost:5001"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "📥 Descarga Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ Node.js y npm verificados"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del servidor..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Instalando dependencias del cliente..."
    cd client
    npm install
    cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Instalando dependencias del servidor..."
    cd server
    npm install
    cd ..
fi

echo "✅ Dependencias verificadas"
echo ""

# Crear directorio de logs si no existe
mkdir -p logs

echo "🎯 Iniciando servidores..."
echo ""
echo "📊 Backend: Puerto 5001"
echo "🌐 Frontend: Puerto 3001"
echo "🔗 Proxy: Configurado automáticamente"
echo ""

# Iniciar en modo desarrollo
npm run dev

echo ""
echo "🛑 Servidores detenidos"
