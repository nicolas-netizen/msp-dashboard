#!/bin/bash

# MSP Dashboard Deployment Script
# Para Ubuntu Server

echo "🚀 Iniciando despliegue de MSP Dashboard..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos como root
if [ "$EUID" -eq 0 ]; then
    print_error "No ejecutar como root. Usar usuario normal con sudo."
    exit 1
fi

# Actualizar sistema
print_status "Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
print_status "Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js instalado: $(node --version)"
else
    print_status "Node.js ya está instalado: $(node --version)"
fi

# Instalar PM2 globalmente
print_status "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_status "PM2 instalado: $(pm2 --version)"
else
    print_status "PM2 ya está instalado: $(pm2 --version)"
fi

# Instalar Nginx
print_status "Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_status "Nginx instalado y configurado"
else
    print_status "Nginx ya está instalado"
fi

# Crear directorio de la aplicación
APP_DIR="/var/www/msp-dashboard"
print_status "Creando directorio de aplicación: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clonar repositorio (asumiendo que ya existe)
if [ -d "$APP_DIR/.git" ]; then
    print_status "Actualizando repositorio..."
    cd $APP_DIR
    git pull origin main
else
    print_error "Repositorio no encontrado. Clona primero el repositorio en $APP_DIR"
    exit 1
fi

# Instalar dependencias
print_status "Instalando dependencias..."
npm install
cd client && npm install && cd ..

# Build de producción
print_status "Construyendo aplicación de producción..."
cd client
npm run build
cd ..

# Configurar variables de entorno
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado. Creando ejemplo..."
    cat > .env << EOF
NODE_ENV=production
PORT=5000
MSP_API_URL=https://api.mspmanager.com
MSP_API_KEY=tu-api-key-aqui
EOF
    print_warning "Edita el archivo .env con tus credenciales reales"
fi

# Configurar firewall
print_status "Configurando firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5000
sudo ufw --force enable

# Configurar Nginx
print_status "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/msp-dashboard > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Frontend React
    location / {
        root $APP_DIR/client/build;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Archivos estáticos
    location /static {
        root $APP_DIR/client/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/msp-dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Iniciar aplicaciones con PM2
print_status "Iniciando aplicaciones con PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Configurar PM2 para iniciar con el sistema
print_status "Configurando PM2 para inicio automático..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Mostrar estado
print_status "Estado de las aplicaciones:"
pm2 status

print_status "Logs de las aplicaciones:"
pm2 logs --lines 10

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📱 Acceso a la aplicación:"
echo "   - Frontend: http://$(curl -s ifconfig.me)"
echo "   - Backend API: http://$(curl -s ifconfig.me):5000"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver estado: pm2 status"
echo "   - Ver logs: pm2 logs"
echo "   - Reiniciar: pm2 restart all"
echo "   - Parar: pm2 stop all"
echo ""
echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales de MSP Manager"
echo ""
