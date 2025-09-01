#!/bin/bash

# Script de despliegue para MSP Dashboard en Ubuntu con sitio existente
# NO INTERRUMPE el sitio web actual

echo "🚀 Iniciando despliegue del MSP Dashboard en Ubuntu..."

# Variables de configuración
APP_NAME="msp-dashboard"
DEPLOY_PATH="/var/www/msp-dashboard"
BACKUP_PATH="/var/backups/msp-dashboard"
LOG_FILE="/var/log/msp-dashboard/deploy.log"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
DOMAIN="msp.tu-dominio.com"  # Subdominio para MSP Dashboard
PORT="5001"  # Puerto diferente para evitar conflictos
FRONTEND_PORT="3001"  # Puerto del frontend en desarrollo
SUBDOMAIN_PATH="/"  # Ruta raíz para el subdominio

# Crear directorios si no existen
mkdir -p $DEPLOY_PATH
mkdir -p $BACKUP_PATH
mkdir -p $(dirname $LOG_FILE)

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Función de verificación de dependencias
check_dependencies() {
    log "🔍 Verificando dependencias del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log "❌ Node.js no está instalado. Instalando..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        apt-get install -y nodejs
    else
        log "✅ Node.js ya está instalado: $(node --version)"
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log "❌ npm no está instalado"
        exit 1
    else
        log "✅ npm ya está instalado: $(npm --version)"
    fi
    
    # Verificar nginx
    if ! command -v nginx &> /dev/null; then
        log "❌ nginx no está instalado. Instalando..."
        apt-get update
        apt-get install -y nginx
    else
        log "✅ nginx ya está instalado: $(nginx -v 2>&1)"
    fi
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        log "📦 Instalando PM2 para gestión de procesos..."
        npm install -g pm2
    else
        log "✅ PM2 ya está instalado: $(pm2 --version)"
    fi
}

# Función de backup del sitio existente
backup_existing_site() {
    log "📦 Creando backup del sitio existente..."
    
    # Backup de configuración de nginx
    if [ -f "$NGINX_SITES/default" ]; then
        cp "$NGINX_SITES/default" "$BACKUP_PATH/nginx-default-backup-$(date +%Y%m%d-%H%M%S)"
        log "✅ Backup de nginx default creado"
    fi
    
    # Backup de cualquier configuración existente
    if [ -d "$DEPLOY_PATH" ] && [ "$(ls -A $DEPLOY_PATH)" ]; then
        tar -czf "$BACKUP_PATH/existing-site-backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $DEPLOY_PATH .
        log "✅ Backup del sitio existente creado"
    fi
}

# Función de instalación de la aplicación
install_application() {
    log "📦 Instalando MSP Dashboard..."
    
    # Copiar archivos de la aplicación
    cp -r . $DEPLOY_PATH/
    cd $DEPLOY_PATH
    
    # Instalar dependencias del servidor
    log "📦 Instalando dependencias del servidor..."
    npm install --production
    
    # Instalar dependencias del cliente
    log "📦 Instalando dependencias del cliente..."
    cd $DEPLOY_PATH/client
    npm install --production
    
    # Construir el cliente para producción
    log "🔨 Construyendo cliente para producción..."
    npm run build
    
    log "✅ Aplicación instalada exitosamente"
}

# Función de configuración de PM2
setup_pm2() {
    log "⚙️ Configurando PM2..."
    
    cd $DEPLOY_PATH
    
    # Crear archivo de configuración de PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'msp-dashboard',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: '/var/log/msp-dashboard/err.log',
    out_file: '/var/log/msp-dashboard/out.log',
    log_file: '/var/log/msp-dashboard/combined.log',
    time: true
  }]
};
EOF

    # Iniciar la aplicación con PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log "✅ PM2 configurado y aplicación iniciada"
}

# Función de configuración de nginx
setup_nginx() {
    log "🌐 Configurando nginx para MSP Dashboard..."
    
    # Crear configuración de nginx para MSP Dashboard
    cat > "$NGINX_SITES/msp-dashboard" << EOF
# Configuración para MSP Dashboard
server {
    listen 80;
    server_name $DOMAIN;
    
    # Logs específicos para MSP Dashboard
    access_log /var/log/nginx/msp-dashboard.access.log;
    error_log /var/log/nginx/msp-dashboard.error.log;
    
    # API backend - Proxy al puerto 5001
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts para APIs
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend estático - Servir archivos construidos
    location / {
        root $DEPLOY_PATH/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache estático para archivos de la aplicación
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Cache para archivos HTML
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public";
        }
    }
    
    # Configuración de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Habilitar el sitio
    ln -sf "$NGINX_SITES/msp-dashboard" "$NGINX_ENABLED/"
    
    # Verificar configuración de nginx
    if nginx -t; then
        log "✅ Configuración de nginx válida"
        systemctl reload nginx
        log "✅ nginx recargado exitosamente"
    else
        log "❌ Error en la configuración de nginx"
        exit 1
    fi
}

# Configuración alternativa para nginx (mismo dominio, ruta específica)
setup_nginx_alternative() {
    log "🌐 Configurando nginx para MSP Dashboard en ruta específica..."
    
    # Crear configuración de nginx para MSP Dashboard en ruta específica
    cat > "$NGINX_SITES/msp-dashboard" << EOF
# Configuración para MSP Dashboard en ruta específica
server {
    listen 80;
    server_name $DOMAIN;
    
    # Logs específicos para MSP Dashboard
    access_log /var/log/nginx/msp-dashboard.access.log;
    error_log /var/log/nginx/msp-dashboard.error.log;
    
    # MSP Dashboard en ruta específica /msp
    location $SUBDOMAIN_PATH/ {
        alias $DEPLOY_PATH/client/build/;
        try_files \$uri \$uri/ $SUBDOMAIN_PATH/index.html;
        
        # Cache estático para archivos de la aplicación
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Cache para archivos HTML
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public";
        }
    }
    
    # API backend - Proxy al puerto 5001
    location $SUBDOMAIN_PATH/api/ {
        proxy_pass http://localhost:$PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts para APIs
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configuración de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    # Habilitar el sitio
    ln -sf "$NGINX_SITES/msp-dashboard" "$NGINX_ENABLED/"
    
    # Verificar configuración de nginx
    if nginx -t; then
        log "✅ Configuración de nginx válida"
        systemctl reload nginx
        log "✅ nginx recargado exitosamente"
    else
        log "❌ Error en la configuración de nginx"
        exit 1
    fi
}

# Función de configuración de firewall
setup_firewall() {
    log "🔥 Configurando firewall..."
    
    # Permitir puerto 80 (HTTP)
    ufw allow 80/tcp
    
    # Permitir puerto 443 (HTTPS) si tienes SSL
    # ufw allow 443/tcp
    
    # Permitir puerto 5001 solo localmente (para el backend)
    ufw allow from 127.0.0.1 to any port $PORT
    
    log "✅ Firewall configurado"
}

# Función de configuración de monitoreo
setup_monitoring() {
    log "📊 Configurando monitoreo..."
    
    # Crear script de health check
    cat > /usr/local/bin/msp-dashboard-health << EOF
#!/bin/bash
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/test-simple)
if [ "\$response" = "200" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MSP Dashboard OK" >> /var/log/msp-dashboard/health.log
    exit 0
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MSP Dashboard ERROR: HTTP \$response" >> /var/log/msp-dashboard/health.log
    # Reiniciar la aplicación si falla
    pm2 restart msp-dashboard
    exit 1
fi
EOF

    chmod +x /usr/local/bin/msp-dashboard-health
    
    # Configurar monitoreo con cron (cada 5 minutos)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/msp-dashboard-health") | crontab -
    
    log "✅ Monitoreo configurado (health check cada 5 minutos)"
}

# Función de configuración de logs
setup_logs() {
    log "📝 Configurando sistema de logs..."
    
    # Crear archivo de configuración de logrotate
    cat > /etc/logrotate.d/msp-dashboard << EOF
/var/log/msp-dashboard/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

    log "✅ Sistema de logs configurado"
}

# Función de verificación final
verify_deployment() {
    log "🔍 Verificando despliegue..."
    
    # Esperar un momento para que la aplicación se inicie
    sleep 10
    
    # Verificar que PM2 esté ejecutando la aplicación
    if pm2 list | grep -q "msp-dashboard.*online"; then
        log "✅ PM2: Aplicación ejecutándose correctamente"
    else
        log "❌ PM2: La aplicación no está ejecutándose"
        pm2 logs msp-dashboard --lines 20
        exit 1
    fi
    
    # Verificar que nginx esté sirviendo la aplicación
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/test-simple | grep -q "200"; then
        log "✅ nginx: API respondiendo correctamente"
    else
        log "❌ nginx: API no responde correctamente"
        exit 1
    fi
    
    # Verificar que el frontend esté disponible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
        log "✅ Frontend: Página principal disponible"
    else
        log "❌ Frontend: Página principal no disponible"
        exit 1
    fi
    
    log "🎉 ¡Despliegue completado exitosamente!"
    log "🌐 MSP Dashboard disponible en: http://$DOMAIN"
    log "📊 Monitoreo: pm2 monit"
    log "📝 Logs: tail -f /var/log/msp-dashboard/combined.log"
}

# Función de limpieza
cleanup() {
    log "🧹 Limpiando archivos temporales..."
    
    # Limpiar backups antiguos (mantener solo los últimos 5)
    ls -t $BACKUP_PATH/*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
    
    # Limpiar logs antiguos
    find /var/log/msp-dashboard -name "*.log" -mtime +30 -delete
    
    log "✅ Limpieza completada"
}

# Función principal de despliegue
deploy() {
    log "🎯 Iniciando proceso de despliegue completo..."
    
    # Verificar que se ejecute como root
    if [ "$EUID" -ne 0 ]; then
        echo "❌ Este script debe ejecutarse como root (sudo)"
        exit 1
    fi
    
    # Verificar dependencias
    check_dependencies
    
    # Backup del sitio existente
    backup_existing_site
    
    # Instalar aplicación
    install_application
    
    # Configurar PM2
    setup_pm2
    
    # Configurar nginx
    setup_nginx
    
    # Configurar firewall
    setup_firewall
    
    # Configurar monitoreo
    setup_monitoring
    
    # Configurar logs
    setup_logs
    
    # Limpieza
    cleanup
    
    # Verificación final
    verify_deployment
}

# Función de rollback
rollback() {
    log "🔄 Iniciando rollback..."
    
    # Detener la aplicación
    pm2 stop msp-dashboard
    pm2 delete msp-dashboard
    
    # Deshabilitar sitio de nginx
    rm -f "$NGINX_ENABLED/msp-dashboard"
    systemctl reload nginx
    
    # Restaurar configuración anterior
    latest_backup=$(ls -t $BACKUP_PATH/nginx-default-backup-*.tar.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        log "📦 Restaurando configuración anterior..."
        tar -xzf "$latest_backup" -C /
        systemctl reload nginx
    fi
    
    log "✅ Rollback completado"
}

# Función de estado
status() {
    echo "📊 Estado del MSP Dashboard:"
    echo "=========================="
    
    echo "PM2 Status:"
    pm2 list | grep msp-dashboard || echo "No encontrado"
    
    echo ""
    echo "Nginx Status:"
    systemctl status nginx --no-pager -l
    
    echo ""
    echo "Puertos en uso:"
    netstat -tlnp | grep -E ":(80|$PORT)" || echo "No encontrados"
    
    echo ""
    echo "Logs recientes:"
    tail -5 /var/log/msp-dashboard/combined.log 2>/dev/null || echo "No hay logs"
}

# Manejo de argumentos
case "$1" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        status
        ;;
    "restart")
        log "🔄 Reiniciando MSP Dashboard..."
        pm2 restart msp-dashboard
        systemctl reload nginx
        log "✅ Reinicio completado"
        ;;
    *)
        echo "Uso: $0 {deploy|rollback|status|restart}"
        echo ""
        echo "Comandos disponibles:"
        echo "  deploy   - Desplegar MSP Dashboard completo"
        echo "  rollback - Revertir a configuración anterior"
        echo "  status   - Mostrar estado actual"
        echo "  restart  - Reiniciar servicios"
        echo ""
        echo "IMPORTANTE: Ejecutar con sudo"
        echo "Ejemplo: sudo $0 deploy"
        exit 1
        ;;
esac
