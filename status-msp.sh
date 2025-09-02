#!/bin/bash

# Script para ver el estado de MSP Dashboard

echo "📊 Estado de MSP Dashboard"
echo "=========================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

# Verificar PM2
print_header "Estado de PM2:"
pm2 status

echo ""

# Verificar puertos específicos
print_header "Puertos MSP Dashboard:"
if netstat -tuln | grep -q ":3004"; then
    print_status "✅ Puerto 3004 (Frontend) - ACTIVO"
else
    print_warning "❌ Puerto 3004 (Frontend) - INACTIVO"
fi

if netstat -tuln | grep -q ":5004"; then
    print_status "✅ Puerto 5004 (Backend) - ACTIVO"
else
    print_warning "❌ Puerto 5004 (Backend) - INACTIVO"
fi

echo ""

# Verificar procesos Node.js específicos
print_header "Procesos MSP Dashboard:"
ps aux | grep -E "(msp-backend|msp-frontend)" | grep -v grep || print_warning "No hay procesos MSP Dashboard corriendo"

echo ""

# Obtener IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

print_header "URLs de acceso:"
echo "   - Frontend: http://localhost:3004"
echo "   - Frontend (red): http://$LOCAL_IP:3004"
echo "   - Backend: http://localhost:5004"
echo "   - Backend (red): http://$LOCAL_IP:5004"

echo ""

# Mostrar logs recientes si la app está corriendo
if pm2 list | grep -q "online"; then
    print_header "Logs recientes:"
    pm2 logs --lines 3
fi

echo ""

# Mostrar uso de memoria
print_header "Uso de memoria:"
free -h

echo ""

# Mostrar espacio en disco
print_header "Espacio en disco:"
df -h | head -2
