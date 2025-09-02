#!/bin/bash

# Script para parar MSP Dashboard

echo "🛑 Parando MSP Dashboard..."

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

# Detener todas las aplicaciones PM2
print_status "Deteniendo aplicaciones PM2..."
pm2 stop all
pm2 delete all

# Liberar puertos si están ocupados
print_status "Liberando puertos 3004 y 5004..."
sudo fuser -k 3004/tcp 2>/dev/null || true
sudo fuser -k 5004/tcp 2>/dev/null || true

print_status "MSP Dashboard detenido correctamente."

# Mostrar puertos libres
echo ""
print_status "Puertos liberados:"
netstat -tuln | grep -E ":(3004|5004)" || echo "   ✅ Puertos 3004 y 5004 están libres"
