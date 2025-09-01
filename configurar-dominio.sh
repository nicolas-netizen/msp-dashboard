#!/bin/bash

# Script para configurar el dominio del MSP Dashboard
echo "🌐 Configurando dominio para MSP Dashboard..."

# Función para mostrar opciones
show_options() {
    echo ""
    echo "Opciones de configuración:"
    echo "1. Subdominio (ej: msp.tu-dominio.com)"
    echo "2. Ruta específica (ej: tu-dominio.com/msp)"
    echo "3. Puerto específico (ej: tu-dominio.com:5001)"
    echo ""
}

# Función para configurar subdominio
setup_subdomain() {
    echo "🌐 Configurando subdominio..."
    read -p "Ingresa tu dominio principal (ej: tu-dominio.com): " MAIN_DOMAIN
    read -p "Ingresa el subdominio (ej: msp): " SUBDOMAIN
    
    DOMAIN="$SUBDOMAIN.$MAIN_DOMAIN"
    
    # Actualizar deploy-ubuntu.sh
    sed -i "s/DOMAIN=.*/DOMAIN=\"$DOMAIN\"/" deploy-ubuntu.sh
    sed -i "s/SUBDOMAIN_PATH=.*/SUBDOMAIN_PATH=\"\/\"/" deploy-ubuntu.sh
    
    echo "✅ Subdominio configurado: $DOMAIN"
    echo "📝 Configura el DNS: A $DOMAIN → IP-DE-TU-SERVIDOR"
    echo "🌐 URL del dashboard: http://$DOMAIN"
}

# Función para configurar ruta específica
setup_path() {
    echo "📁 Configurando ruta específica..."
    read -p "Ingresa tu dominio (ej: tu-dominio.com): " MAIN_DOMAIN
    read -p "Ingresa la ruta (ej: msp): " PATH_NAME
    
    DOMAIN="$MAIN_DOMAIN"
    SUBDOMAIN_PATH="/$PATH_NAME"
    
    # Actualizar deploy-ubuntu.sh
    sed -i "s/DOMAIN=.*/DOMAIN=\"$DOMAIN\"/" deploy-ubuntu.sh
    sed -i "s/SUBDOMAIN_PATH=.*/SUBDOMAIN_PATH=\"$SUBDOMAIN_PATH\"/" deploy-ubuntu.sh
    
    echo "✅ Ruta configurada: $DOMAIN$SUBDOMAIN_PATH"
}

# Función para configurar puerto específico
setup_port() {
    echo "🔌 Configurando puerto específico..."
    read -p "Ingresa tu dominio (ej: tu-dominio.com): " MAIN_DOMAIN
    read -p "Ingresa el puerto (ej: 5001): " CUSTOM_PORT
    
    DOMAIN="$MAIN_DOMAIN"
    PORT="$CUSTOM_PORT"
    
    # Actualizar deploy-ubuntu.sh
    sed -i "s/DOMAIN=.*/DOMAIN=\"$DOMAIN\"/" deploy-ubuntu.sh
    sed -i "s/PORT=.*/PORT=\"$PORT\"/" deploy-ubuntu.sh
    sed -i "s/SUBDOMAIN_PATH=.*/SUBDOMAIN_PATH=\"\/\"/" deploy-ubuntu.sh
    
    echo "✅ Puerto configurado: $DOMAIN:$PORT"
}

# Función para mostrar configuración actual
show_current() {
    echo "📋 Configuración actual:"
    echo "Dominio: $(grep 'DOMAIN=' deploy-ubuntu.sh | cut -d'"' -f2)"
    echo "Puerto: $(grep 'PORT=' deploy-ubuntu.sh | cut -d'"' -f2)"
    echo "Ruta: $(grep 'SUBDOMAIN_PATH=' deploy-ubuntu.sh | cut -d'"' -f2)"
}

# Menú principal
while true; do
    show_current
    show_options
    read -p "Selecciona una opción (1-3) o 'q' para salir: " choice
    
    case $choice in
        1)
            setup_subdomain
            break
            ;;
        2)
            setup_path
            break
            ;;
        3)
            setup_port
            break
            ;;
        q|Q)
            echo "👋 Configuración cancelada"
            exit 0
            ;;
        *)
            echo "❌ Opción inválida"
            ;;
    esac
done

echo ""
echo "🎉 Configuración completada!"
echo "Ahora puedes ejecutar: sudo ./deploy-ubuntu.sh deploy"
