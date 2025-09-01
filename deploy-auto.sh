#!/bin/bash

# Script de despliegue automático para MSP Dashboard
echo "🚀 Iniciando despliegue automático del MSP Dashboard..."

# Variables de configuración
APP_NAME="msp-dashboard"
DEPLOY_PATH="/var/www/msp-dashboard"
BACKUP_PATH="/var/backups/msp-dashboard"
LOG_FILE="/var/log/msp-dashboard/deploy.log"

# Crear directorios si no existen
mkdir -p $DEPLOY_PATH
mkdir -p $BACKUP_PATH
mkdir -p $(dirname $LOG_FILE)

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Función de backup
backup_current() {
    if [ -d "$DEPLOY_PATH" ]; then
        log "📦 Creando backup de la versión actual..."
        tar -czf "$BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $DEPLOY_PATH .
        log "✅ Backup creado exitosamente"
    fi
}

# Función de limpieza de backups antiguos (mantener solo los últimos 5)
cleanup_old_backups() {
    log "🧹 Limpiando backups antiguos..."
    ls -t $BACKUP_PATH/backup-*.tar.gz | tail -n +6 | xargs -r rm
    log "✅ Limpieza completada"
}

# Función de instalación de dependencias
install_dependencies() {
    log "📦 Instalando dependencias del servidor..."
    cd $DEPLOY_PATH
    npm install --production
    log "✅ Dependencias del servidor instaladas"
    
    log "📦 Instalando dependencias del cliente..."
    cd $DEPLOY_PATH/client
    npm install --production
    npm run build
    log "✅ Cliente construido exitosamente"
}

# Función de configuración de servicios
setup_services() {
    log "⚙️ Configurando servicios del sistema..."
    
    # Crear archivo de servicio systemd
    cat > /etc/systemd/system/msp-dashboard.service << EOF
[Unit]
Description=MSP Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_PATH
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

    # Recargar systemd y habilitar servicio
    systemctl daemon-reload
    systemctl enable msp-dashboard
    log "✅ Servicio configurado y habilitado"
}

# Función de configuración de nginx
setup_nginx() {
    log "🌐 Configurando nginx..."
    
    cat > /etc/nginx/sites-available/msp-dashboard << EOF
server {
    listen 80;
    server_name msp-dashboard.local;
    
    # Redirigir a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name msp-dashboard.local;
    
    ssl_certificate /etc/ssl/certs/msp-dashboard.crt;
    ssl_certificate_key /etc/ssl/private/msp-dashboard.key;
    
    # Configuración de seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # API backend
    location /api/ {
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
    
    # Frontend estático
    location / {
        root $DEPLOY_PATH/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache estático
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Logs
    access_log /var/log/nginx/msp-dashboard.access.log;
    error_log /var/log/nginx/msp-dashboard.error.log;
}
EOF

    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/msp-dashboard /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    log "✅ Nginx configurado exitosamente"
}

# Función de monitoreo
setup_monitoring() {
    log "📊 Configurando monitoreo..."
    
    # Crear script de health check
    cat > /usr/local/bin/msp-dashboard-health << EOF
#!/bin/bash
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/test-simple)
if [ "\$response" = "200" ]; then
    echo "OK"
    exit 0
else
    echo "ERROR: HTTP \$response"
    exit 1
fi
EOF

    chmod +x /usr/local/bin/msp-dashboard-health
    
    # Configurar monitoreo con cron
    echo "*/5 * * * * /usr/local/bin/msp-dashboard-health >> /var/log/msp-dashboard/health.log 2>&1" | crontab -
    log "✅ Monitoreo configurado"
}

# Función principal de despliegue
deploy() {
    log "🎯 Iniciando proceso de despliegue..."
    
    # Backup actual
    backup_current
    
    # Instalar dependencias
    install_dependencies
    
    # Configurar servicios
    setup_services
    
    # Configurar nginx
    setup_nginx
    
    # Configurar monitoreo
    setup_monitoring
    
    # Limpiar backups antiguos
    cleanup_old_backups
    
    # Reiniciar servicios
    log "🔄 Reiniciando servicios..."
    systemctl restart msp-dashboard
    systemctl reload nginx
    
    # Verificar estado
    sleep 5
    if systemctl is-active --quiet msp-dashboard; then
        log "✅ Despliegue completado exitosamente"
        log "🌐 Dashboard disponible en: https://msp-dashboard.local"
    else
        log "❌ Error: El servicio no se inició correctamente"
        systemctl status msp-dashboard
        exit 1
    fi
}

# Función de rollback
rollback() {
    log "🔄 Iniciando rollback..."
    
    # Detener servicio
    systemctl stop msp-dashboard
    
    # Restaurar último backup
    latest_backup=$(ls -t $BACKUP_PATH/backup-*.tar.gz | head -1)
    if [ -n "$latest_backup" ]; then
        log "📦 Restaurando desde: $latest_backup"
        tar -xzf "$latest_backup" -C $DEPLOY_PATH
        systemctl start msp-dashboard
        log "✅ Rollback completado"
    else
        log "❌ No se encontraron backups para restaurar"
        exit 1
    fi
}

# Manejo de argumentos
case "$1" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "backup")
        backup_current
        ;;
    *)
        echo "Uso: $0 {deploy|rollback|backup}"
        echo "  deploy   - Desplegar nueva versión"
        echo "  rollback - Revertir a versión anterior"
        echo "  backup   - Crear backup manual"
        exit 1
        ;;
esac
