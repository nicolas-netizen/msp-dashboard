#!/bin/bash

# Script para reiniciar MSP Dashboard

echo "🔄 Reiniciando MSP Dashboard..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Reiniciar aplicaciones PM2
print_status "Reiniciando aplicaciones PM2..."
pm2 restart all

# Esperar un momento
sleep 3

# Verificar estado
print_status "Verificando estado después del reinicio..."
pm2 status

echo ""
print_status "✅ MSP Dashboard reiniciado correctamente."

# Mostrar URLs de acceso
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "📱 Acceso a la aplicación:"
echo "   - Frontend: http://localhost:3004"
echo "   - Frontend (red): http://$LOCAL_IP:3004"
echo "   - Backend: http://localhost:5004"
echo "   - Backend (red): http://$LOCAL_IP:5004"
