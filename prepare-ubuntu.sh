#!/bin/bash

# Script de preparación rápida para Ubuntu
echo "⚡ Preparación rápida para MSP Dashboard en Ubuntu..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
echo "📦 Instalando dependencias básicas..."
apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18.x
echo "📦 Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p /var/www/msp-dashboard
mkdir -p /var/log/msp-dashboard
mkdir -p /var/backups/msp-dashboard

# Configurar permisos
echo "🔐 Configurando permisos..."
chown -R www-data:www-data /var/www/msp-dashboard
chown -R www-data:www-data /var/log/msp-dashboard
chown -R www-data:www-data /var/backups/msp-dashboard

echo "🎉 Preparación completada!"
echo "Ahora puedes ejecutar: sudo ./deploy-ubuntu.sh deploy"
