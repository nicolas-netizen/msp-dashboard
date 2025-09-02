#!/bin/bash

# MSP Dashboard - Deploy Completo
# Script para desplegar en puertos específicos (3004 y 5004)

echo "🚀 MSP Dashboard - Deploy Completo"
echo "=================================="
echo "Puertos configurados:"
echo "  - Frontend: 3004"
echo "  - Backend: 5004"
echo ""

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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar que no estamos como root
if [ "$EUID" -eq 0 ]; then
    print_error "No ejecutar como root. Usar usuario normal con sudo."
    exit 1
fi

print_header "1. Verificando dependencias del sistema..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_status "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js ya está instalado: $(node --version)"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    print_status "Instalando PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 ya está instalado: $(pm2 --version)"
fi

print_header "2. Deteniendo aplicaciones existentes..."

# Detener aplicaciones PM2 existentes
pm2 delete all 2>/dev/null || true

# Verificar que los puertos estén libres
print_status "Verificando puertos 3004 y 5004..."
if netstat -tuln | grep -q ":3004"; then
    print_warning "Puerto 3004 está en uso. Intentando liberar..."
    sudo fuser -k 3004/tcp 2>/dev/null || true
fi

if netstat -tuln | grep -q ":5004"; then
    print_warning "Puerto 5004 está en uso. Intentando liberar..."
    sudo fuser -k 5004/tcp 2>/dev/null || true
fi

print_header "3. Instalando dependencias..."

# Instalar dependencias del servidor
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias del servidor..."
    npm install
else
    print_status "Dependencias del servidor ya instaladas"
fi

# Instalar dependencias del cliente
if [ ! -d "client/node_modules" ]; then
    print_status "Instalando dependencias del cliente..."
    cd client && npm install && cd ..
else
    print_status "Dependencias del cliente ya instaladas"
fi

print_header "4. Configurando variables de entorno..."

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_status "Creando archivo .env..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=5004
MSP_API_URL=https://api.mspmanager.com
# Agrega aquí tus credenciales de MSP Manager si las necesitas
EOF
    print_warning "Archivo .env creado. Edita con tus credenciales si es necesario."
fi

print_header "5. Creando configuración PM2..."

# Crear archivo ecosystem.config.js actualizado
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'msp-backend',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5004
      },
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'msp-frontend',
      script: 'npm',
      args: 'start',
      cwd: './client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

# Crear directorio de logs
mkdir -p logs

print_header "6. Configurando firewall..."

# Configurar firewall para los puertos específicos
sudo ufw allow 3004/tcp 2>/dev/null || true
sudo ufw allow 5004/tcp 2>/dev/null || true
print_status "Puertos 3004 y 5004 abiertos en firewall"

print_header "7. Iniciando aplicaciones con PM2..."

# Iniciar aplicaciones
pm2 start ecosystem.config.js --env development

# Configurar PM2 para inicio automático
print_status "Configurando inicio automático..."
pm2 startup 2>/dev/null || true
pm2 save

print_header "8. Verificando despliegue..."

# Esperar un momento para que las aplicaciones se inicien
sleep 5

# Verificar estado
print_status "Estado de las aplicaciones:"
pm2 status

# Verificar puertos
print_status "Puertos en uso:"
netstat -tuln | grep -E ":(3004|5004)" || print_warning "Los puertos no están activos aún"

# Obtener IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🎉 ¡Deploy completado!"
echo "======================"
echo ""
echo "📱 Acceso a la aplicación:"
echo "   - Frontend: http://localhost:3004"
echo "   - Frontend (red): http://$LOCAL_IP:3004"
echo "   - Backend API: http://localhost:5004"
echo "   - Backend API (red): http://$LOCAL_IP:5004"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver estado: pm2 status"
echo "   - Ver logs: pm2 logs"
echo "   - Ver logs específicos: pm2 logs msp-backend o pm2 logs msp-frontend"
echo "   - Reiniciar: pm2 restart all"
echo "   - Parar: pm2 stop all"
echo "   - Monitoreo: pm2 monit"
echo ""
echo "📊 Logs disponibles en:"
echo "   - ./logs/backend-*.log"
echo "   - ./logs/frontend-*.log"
echo ""
echo "✅ La aplicación ahora corre en segundo plano y se iniciará automáticamente al reiniciar el servidor."
echo ""

# Mostrar logs recientes
print_header "Logs recientes:"
pm2 logs --lines 3
