#!/bin/bash

echo "🚀 MSP Dashboard - Instalación y inicio fácil"
echo "Puertos: Frontend 3004 | Backend 5004"
echo

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para instalar dependencias
install_deps() {
    echo -e "${BLUE}📦 Instalando dependencias de Node.js...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⏳ Instalando Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo -e "${GREEN}✅ Node.js ya está instalado: $(node --version)${NC}"
    fi
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⏳ Instalando PM2...${NC}"
        sudo npm install -g pm2
    else
        echo -e "${GREEN}✅ PM2 ya está instalado: $(pm2 --version)${NC}"
    fi
    
    # Instalar dependencias del servidor
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⏳ Instalando dependencias del servidor...${NC}"
        npm install
    else
        echo -e "${GREEN}✅ Dependencias del servidor ya instaladas${NC}"
    fi
    
    # Instalar dependencias del cliente
    if [ ! -d "client/node_modules" ]; then
        echo -e "${YELLOW}⏳ Instalando dependencias del cliente...${NC}"
        cd client && npm install && cd ..
    else
        echo -e "${GREEN}✅ Dependencias del cliente ya instaladas${NC}"
    fi
    
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
}

# Función para iniciar servicios
start_services() {
    echo -e "${YELLOW}🔧 Iniciando MSP Dashboard...${NC}"
    
    # Verificar puertos antes de iniciar
    check_ports
    
    # Detener aplicaciones PM2 existentes
    pm2 delete all 2>/dev/null || true
    
    # Crear archivo ecosystem.config.js
    create_ecosystem_config
    
    # Iniciar con PM2
    pm2 start ecosystem.config.js --env development
    
    # Configurar PM2 para inicio automático
    pm2 startup 2>/dev/null || true
    pm2 save
    
    echo -e "${YELLOW}⏳ Esperando que los servicios se inicien...${NC}"
    sleep 8
    
    # Verificar que los servicios estén funcionando
    echo -e "${YELLOW}🔍 Verificando conectividad...${NC}"
    
    # Verificar backend
    if curl -s http://localhost:5004/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend funcionando en puerto 5004${NC}"
    else
        echo -e "${RED}❌ Error: Backend no responde en puerto 5004${NC}"
        return 1
    fi
    
    # Verificar frontend
    if curl -s http://localhost:3004/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend funcionando en puerto 3004${NC}"
    else
        echo -e "${RED}❌ Error: Frontend no responde en puerto 3004${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🎉 ¡MSP Dashboard iniciado!${NC}"
    get_ip
}

# Función para crear configuración PM2
create_ecosystem_config() {
    echo -e "${BLUE}📝 Creando configuración PM2...${NC}"
    
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
}

# Función para obtener IP
get_ip() {
    IP=$(hostname -I | awk '{print $1}')
    echo -e "${BLUE}🌐 Tu IP de Ubuntu es: ${IP}${NC}"
    echo -e "${GREEN}📍 URLs para acceder desde Windows:${NC}"
    echo -e "${GREEN}   Frontend: http://${IP}:3004${NC}"
    echo -e "${GREEN}   Backend API: http://${IP}:5004${NC}"
    echo -e "${GREEN}   Dashboard: http://${IP}:3004${NC}"
}

# Función para verificar estado
check_status() {
    echo -e "${BLUE}📊 Estado del MSP Dashboard:${NC}"
    
    # Verificar PM2
    echo -e "${BLUE}🔍 Estado de PM2:${NC}"
    pm2 status
    
    # Verificar backend
    if pm2 list | grep -q "msp-backend.*online"; then
        echo -e "${GREEN}✅ Backend ejecutándose${NC}"
        if curl -s http://localhost:5004/ > /dev/null 2>&1; then
            echo -e "${GREEN}   🌐 Backend responde en puerto 5004${NC}"
        else
            echo -e "${RED}   ❌ Backend no responde en puerto 5004${NC}"
        fi
    else
        echo -e "${RED}❌ Backend no ejecutándose${NC}"
    fi
    
    # Verificar frontend
    if pm2 list | grep -q "msp-frontend.*online"; then
        echo -e "${GREEN}✅ Frontend ejecutándose${NC}"
        if curl -s http://localhost:3004/ > /dev/null 2>&1; then
            echo -e "${GREEN}   🌐 Frontend responde en puerto 3004${NC}"
        else
            echo -e "${RED}   ❌ Frontend no responde en puerto 3004${NC}"
        fi
    else
        echo -e "${RED}❌ Frontend no ejecutándose${NC}"
    fi
    
    # Verificar puertos
    echo -e "${BLUE}🔍 Estado de puertos:${NC}"
    if netstat -tlnp | grep :5004 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Puerto 5004 en uso${NC}"
    else
        echo -e "${RED}   ❌ Puerto 5004 libre${NC}"
    fi
    
    if netstat -tlnp | grep :3004 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Puerto 3004 en uso${NC}"
    else
        echo -e "${RED}   ❌ Puerto 3004 libre${NC}"
    fi
    
    get_ip
}

# Función para detener servicios
stop_services() {
    echo -e "${RED}🛑 Deteniendo MSP Dashboard...${NC}"
    
    # Detener aplicaciones PM2
    pm2 stop all
    pm2 delete all
    
    # Liberar puertos si están ocupados
    echo -e "${YELLOW}💡 Liberando puertos 3004 y 5004...${NC}"
    sudo fuser -k 3004/tcp 2>/dev/null || true
    sudo fuser -k 5004/tcp 2>/dev/null || true
    
    echo -e "${GREEN}✅ MSP Dashboard detenido${NC}"
}

# Función para verificar puertos
check_ports() {
    echo -e "${BLUE}🔍 Verificando puertos disponibles...${NC}"
    
    # Verificar puerto 5004
    if netstat -tlnp | grep :5004 > /dev/null 2>&1; then
        echo -e "${RED}❌ Puerto 5004 ya está en uso${NC}"
        echo -e "${YELLOW}💡 Liberando puerto 5004...${NC}"
        sudo fuser -k 5004/tcp 2>/dev/null || true
        sleep 2
    else
        echo -e "${GREEN}✅ Puerto 5004 disponible${NC}"
    fi
    
    # Verificar puerto 3004
    if netstat -tlnp | grep :3004 > /dev/null 2>&1; then
        echo -e "${RED}❌ Puerto 3004 ya está en uso${NC}"
        echo -e "${YELLOW}💡 Liberando puerto 3004...${NC}"
        sudo fuser -k 3004/tcp 2>/dev/null || true
        sleep 2
    else
        echo -e "${GREEN}✅ Puerto 3004 disponible${NC}"
    fi
}

# Función para reiniciar servicios
restart_services() {
    echo -e "${YELLOW}🔄 Reiniciando MSP Dashboard...${NC}"
    stop_services
    sleep 3
    start_services
    if [ $? -eq 0 ]; then
        get_ip
        echo -e "${GREEN}✅ Servicios reiniciados exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al reiniciar servicios${NC}"
    fi
}

# Función para ver logs
show_logs() {
    echo -e "${BLUE}📋 Logs del MSP Dashboard:${NC}"
    
    if pm2 list | grep -q "online"; then
        echo -e "${GREEN}✅ Aplicaciones ejecutándose${NC}"
        echo -e "${YELLOW}💡 Mostrando logs recientes...${NC}"
        pm2 logs --lines 10
    else
        echo -e "${RED}❌ No hay aplicaciones ejecutándose${NC}"
    fi
}

# Función para limpiar entorno
clean_environment() {
    echo -e "${YELLOW}🧹 Limpiando entorno...${NC}"
    
    # Detener servicios
    stop_services
    
    # Eliminar archivos temporales
    rm -f ecosystem.config.js
    
    # Limpiar logs
    if [ -d "logs" ]; then
        echo -e "${YELLOW}🗑️ Eliminando logs...${NC}"
        rm -rf logs
    fi
    
    # Limpiar node_modules (opcional)
    echo -e "${YELLOW}¿Eliminar node_modules? (y/n):${NC}"
    read -p "Respuesta: " clean_node
    
    if [ "$clean_node" = "y" ] || [ "$clean_node" = "Y" ]; then
        if [ -d "node_modules" ]; then
            echo -e "${YELLOW}🗑️ Eliminando node_modules del servidor...${NC}"
            rm -rf node_modules
        fi
        
        if [ -d "client/node_modules" ]; then
            echo -e "${YELLOW}🗑️ Eliminando node_modules del cliente...${NC}"
            rm -rf client/node_modules
        fi
    fi
    
    echo -e "${GREEN}✅ Entorno limpiado${NC}"
    echo -e "${BLUE}💡 Ejecuta opción 1 para reinstalar todo desde cero${NC}"
}

# Función para verificar dependencias
check_dependencies() {
    echo -e "${BLUE}🔍 Verificando dependencias...${NC}"
    
    # Verificar Node.js
    if command -v node >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Node.js disponible: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js no disponible${NC}"
    fi
    
    # Verificar npm
    if command -v npm >/dev/null 2>&1; then
        echo -e "${GREEN}✅ NPM disponible: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ NPM no disponible${NC}"
    fi
    
    # Verificar PM2
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PM2 disponible: $(pm2 --version)${NC}"
    else
        echo -e "${RED}❌ PM2 no disponible${NC}"
    fi
    
    # Verificar dependencias del servidor
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ Dependencias del servidor instaladas${NC}"
        echo -e "${BLUE}📦 Dependencias principales:${NC}"
        if [ -f "package.json" ]; then
            echo -e "${GREEN}   ✅ Express, CORS, Axios, Moment${NC}"
        fi
    else
        echo -e "${RED}❌ Dependencias del servidor no instaladas${NC}"
    fi
    
    # Verificar dependencias del cliente
    if [ -d "client/node_modules" ]; then
        echo -e "${GREEN}✅ Dependencias del cliente instaladas${NC}"
        echo -e "${BLUE}📦 Dependencias principales:${NC}"
        if [ -f "client/package.json" ]; then
            echo -e "${GREEN}   ✅ React, React-Scripts${NC}"
        fi
    else
        echo -e "${RED}❌ Dependencias del cliente no instaladas${NC}"
    fi
}

# Función para crear backup
create_backup() {
    echo -e "${BLUE}💾 Creando backup del MSP Dashboard...${NC}"
    
    # Crear directorio de backups si no existe
    mkdir -p ../MSP_backups
    
    # Crear nombre del backup con timestamp
    BACKUP_NAME="MSP_Dashboard_backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="../MSP_backups/$BACKUP_NAME"
    
    echo -e "${YELLOW}📁 Creando backup: $BACKUP_NAME${NC}"
    
    # Crear backup excluyendo archivos innecesarios
    tar --exclude='node_modules' --exclude='client/node_modules' --exclude='.git' \
        --exclude='logs' --exclude='*.log' \
        -czf "$BACKUP_PATH.tar.gz" .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup creado exitosamente: $BACKUP_PATH.tar.gz${NC}"
        echo -e "${BLUE}📊 Tamaño del backup: $(du -h "$BACKUP_PATH.tar.gz" | cut -f1)${NC}"
    else
        echo -e "${RED}❌ Error al crear backup${NC}"
    fi
}

# Función para restaurar backup
restore_backup() {
    echo -e "${BLUE}🔄 Restaurando backup...${NC}"
    
    # Listar backups disponibles
    if [ ! -d "../MSP_backups" ] || [ -z "$(ls -A ../MSP_backups 2>/dev/null)" ]; then
        echo -e "${RED}❌ No hay backups disponibles${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📁 Backups disponibles:${NC}"
    ls -la ../MSP_backups/*.tar.gz 2>/dev/null | nl
    
    echo -e "${YELLOW}💡 Para restaurar, selecciona el número del backup:${NC}"
    read -p "Número del backup: " backup_num
    
    # Obtener el archivo seleccionado
    BACKUP_FILE=$(ls ../MSP_backups/*.tar.gz 2>/dev/null | sed -n "${backup_num}p")
    
    if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup no válido${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔄 Restaurando: $(basename "$BACKUP_FILE")${NC}"
    
    # Detener servicios antes de restaurar
    stop_services
    
    # Crear backup del estado actual
    create_backup
    
    # Restaurar backup
    tar -xzf "$BACKUP_FILE" -C . --strip-components=0
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup restaurado exitosamente${NC}"
        echo -e "${BLUE}💡 Ejecuta opción 1 para reinstalar dependencias${NC}"
    else
        echo -e "${RED}❌ Error al restaurar backup${NC}"
    fi
}

# Función para monitoreo en tiempo real
monitor_system() {
    echo -e "${BLUE}📊 Monitoreo del MSP Dashboard en tiempo real${NC}"
    echo -e "${YELLOW}💡 Presiona Ctrl+C para salir${NC}"
    echo
    
    # Función para mostrar estadísticas
    show_stats() {
        clear
        echo -e "${BLUE}📊 Monitoreo MSP Dashboard - $(date)${NC}"
        echo "=================================================="
        
        # Uso de CPU y memoria
        echo -e "${GREEN}💻 CPU y Memoria:${NC}"
        top -bn1 | grep "Cpu(s)" | awk '{print "CPU: " $2}' | head -1
        free -h | grep "Mem:" | awk '{print "Memoria: " $3 "/" $2 " (" $3/$2*100 "%)"}'
        
        # Uso de disco
        echo -e "${GREEN}💾 Disco:${NC}"
        df -h / | awk 'NR==2 {print "Disco: " $3 "/" $2 " (" $5 ")"}'
        
        # Estado de PM2
        echo -e "${GREEN}🚀 Estado de PM2:${NC}"
        pm2 status | grep -E "(msp-backend|msp-frontend)" || echo "   ❌ No hay aplicaciones MSP ejecutándose"
        
        # Puertos en uso
        echo -e "${GREEN}🌐 Puertos MSP:${NC}"
        if netstat -tlnp | grep :5004 > /dev/null 2>&1; then
            echo -e "   ✅ Puerto 5004 (Backend) - Activo"
        else
            echo -e "   ❌ Puerto 5004 (Backend) - Inactivo"
        fi
        
        if netstat -tlnp | grep :3004 > /dev/null 2>&1; then
            echo -e "   ✅ Puerto 3004 (Frontend) - Activo"
        else
            echo -e "   ❌ Puerto 3004 (Frontend) - Inactivo"
        fi
        
        # Conexiones activas
        echo -e "${GREEN}🔗 Conexiones Activas:${NC}"
        netstat -an | grep :5004 | wc -l | awk '{print "   Backend (5004): " $1 " conexiones"}'
        netstat -an | grep :3004 | wc -l | awk '{print "   Frontend (3004): " $1 " conexiones"}'
        
        # IP local
        IP=$(hostname -I | awk '{print $1}')
        echo -e "${GREEN}🌐 Acceso:${NC}"
        echo -e "   Frontend: http://$IP:3004"
        echo -e "   Backend: http://$IP:5004"
        
        echo "=================================================="
        echo -e "${YELLOW}💡 Actualizando cada 5 segundos... Presiona Ctrl+C para salir${NC}"
    }
    
    # Mostrar estadísticas cada 5 segundos
    while true; do
        show_stats
        sleep 5
    done
}

# Función para configurar firewall
configure_firewall() {
    echo -e "${BLUE}🔥 Configurando firewall...${NC}"
    
    # Abrir puertos específicos
    sudo ufw allow 3004/tcp 2>/dev/null || true
    sudo ufw allow 5004/tcp 2>/dev/null || true
    
    echo -e "${GREEN}✅ Puertos 3004 y 5004 abiertos en firewall${NC}"
    
    # Mostrar estado del firewall
    echo -e "${BLUE}📊 Estado del firewall:${NC}"
    sudo ufw status
}

# Menú principal
echo -e "${YELLOW}Selecciona una opción:${NC}"
echo "1) Instalar todo desde cero"
echo "2) Solo iniciar (si ya está instalado)"
echo "3) Solo instalar dependencias"
echo "4) Ver estado"
echo "5) Detener todo"
echo "6) Ver IP y URLs"
echo "7) Verificar puertos"
echo "8) Reiniciar servicios"
echo "9) Ver logs"
echo "10) Limpiar entorno completamente"
echo "11) Verificar dependencias"
echo "12) Crear backup"
echo "13) Restaurar backup"
echo "14) Monitoreo en tiempo real"
echo "15) Configurar firewall"
echo

read -p "Opción: " choice

case $choice in
    1)
        install_deps
        start_services
        if [ $? -eq 0 ]; then
            configure_firewall
        else
            echo -e "${RED}❌ Error al iniciar servicios${NC}"
        fi
        ;;
    2)
        start_services
        if [ $? -eq 0 ]; then
            get_ip
        else
            echo -e "${RED}❌ Error al iniciar servicios${NC}"
        fi
        ;;
    3)
        install_deps
        ;;
    4)
        check_status
        ;;
    5)
        stop_services
        ;;
    6)
        get_ip
        ;;
    7)
        check_ports
        ;;
    8)
        restart_services
        ;;
    9)
        show_logs
        ;;
    10)
        clean_environment
        ;;
    11)
        check_dependencies
        ;;
    12)
        create_backup
        ;;
    13)
        restore_backup
        ;;
    14)
        monitor_system
        ;;
    15)
        configure_firewall
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        ;;
esac
