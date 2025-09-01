# 🚀 Guía de Despliegue MSP Dashboard en Ubuntu

## 📋 Requisitos Previos

- Ubuntu 20.04 o superior
- Acceso root (sudo)
- Dominio configurado (opcional pero recomendado)
- Conexión a internet estable

## 🔧 Pasos de Despliegue

### Paso 1: Preparación del Sistema
```bash
# Subir archivos al servidor
scp -r Msp-New/ user@tu-servidor:/home/user/

# Conectar al servidor
ssh user@tu-servidor

# Navegar al directorio
cd /home/user/Msp-New

# Hacer ejecutables los scripts
chmod +x prepare-ubuntu.sh
chmod +x deploy-ubuntu.sh

# Ejecutar preparación
sudo ./prepare-ubuntu.sh
```

### Paso 2: Configuración del Dominio
```bash
# Ejecutar script de configuración interactivo
chmod +x configurar-dominio.sh
./configurar-dominio.sh

# O editar manualmente el script de despliegue
nano deploy-ubuntu.sh

# Cambiar estas líneas según tu preferencia:
DOMAIN="tu-dominio.com"  # Tu dominio principal
PORT="5001"  # Puerto diferente para evitar conflictos
SUBDOMAIN_PATH="/msp"  # Ruta específica (ej: /msp, /dashboard, etc.)
```

### Paso 3: Despliegue Completo
```bash
# Ejecutar despliegue
sudo ./deploy-ubuntu.sh deploy
```

### Paso 4: Verificación
```bash
# Verificar estado
sudo ./deploy-ubuntu.sh status

# Ver logs en tiempo real
tail -f /var/log/msp-dashboard/combined.log

# Monitorear con PM2
pm2 monit
```

## 🌐 Opciones de Configuración

### Opción 1: Subdominio (Recomendado)
```
A     msp.tu-dominio.com    →    IP-DE-TU-SERVIDOR
```
URL: `http://msp.tu-dominio.com`

### Opción 2: Ruta Específica
```
A     tu-dominio.com    →    IP-DE-TU-SERVIDOR
```
URL: `http://tu-dominio.com/msp`

### Opción 3: Puerto Específico
```
A     tu-dominio.com    →    IP-DE-TU-SERVIDOR
```
URL: `http://tu-dominio.com:5001`

## 🔧 Comandos de Mantenimiento

### Ver Estado
```bash
sudo ./deploy-ubuntu.sh status
```

### Reiniciar Servicios
```bash
sudo ./deploy-ubuntu.sh restart
```

### Rollback (si algo sale mal)
```bash
sudo ./deploy-ubuntu.sh rollback
```

### Ver Logs
```bash
# Logs de la aplicación
tail -f /var/log/msp-dashboard/combined.log

# Logs de nginx
tail -f /var/log/nginx/msp-dashboard.access.log
tail -f /var/log/nginx/msp-dashboard.error.log

# Logs de PM2
pm2 logs msp-dashboard
```

## 📊 Monitoreo

### Health Check Automático
- Se ejecuta cada 5 minutos
- Reinicia automáticamente si falla
- Logs en: `/var/log/msp-dashboard/health.log`

### Alertas Automáticas
- Tickets sin asignar por más de 24 horas
- Horas extras excesivas (>12h/día)
- Clientes inactivos

### Reportes Automáticos
- Generados cada domingo a las 23:00
- Incluyen estadísticas semanales completas

## 🔒 Seguridad

### Firewall Configurado
- Puerto 80 (HTTP) abierto
- Puerto 5000 solo localmente
- Puerto 443 (HTTPS) comentado (habilitar si tienes SSL)

### Headers de Seguridad
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

## 📁 Estructura de Archivos

```
/var/www/msp-dashboard/          # Aplicación
/var/log/msp-dashboard/          # Logs
/var/backups/msp-dashboard/      # Backups
/etc/nginx/sites-available/      # Configuración nginx
```

## 🚨 Solución de Problemas

### La aplicación no inicia
```bash
# Ver logs de PM2
pm2 logs msp-dashboard

# Reiniciar manualmente
pm2 restart msp-dashboard
```

### nginx no funciona
```bash
# Verificar configuración
nginx -t

# Reiniciar nginx
systemctl restart nginx
```

### Puerto 5000 ocupado
```bash
# Ver qué usa el puerto
netstat -tlnp | grep :5000

# Cambiar puerto en deploy-ubuntu.sh
PORT="5001"
```

## 📈 Optimización

### Cache de nginx
- Archivos estáticos cacheados por 1 año
- HTML cacheado por 1 hora
- APIs sin cache para datos frescos

### PM2 Optimizado
- Reinicio automático en fallos
- Límite de memoria: 1GB
- Logs con timestamps

## 🔄 Actualizaciones

### Actualizar Código
```bash
# Hacer backup
sudo ./deploy-ubuntu.sh backup

# Subir nuevo código
scp -r Msp-New/ user@tu-servidor:/home/user/

# Redesplegar
sudo ./deploy-ubuntu.sh deploy
```

### Actualizar Dependencias
```bash
cd /var/www/msp-dashboard
npm update
pm2 restart msp-dashboard
```

## 📞 Soporte

### Logs Importantes
- `/var/log/msp-dashboard/deploy.log` - Logs de despliegue
- `/var/log/msp-dashboard/combined.log` - Logs de la aplicación
- `/var/log/msp-dashboard/health.log` - Health checks

### Comandos Útiles
```bash
# Ver uso de recursos
htop

# Ver espacio en disco
df -h

# Ver memoria
free -h

# Ver procesos
ps aux | grep node
```

## ✅ Checklist de Despliegue

- [ ] Sistema preparado con `prepare-ubuntu.sh`
- [ ] Dominio configurado en `deploy-ubuntu.sh`
- [ ] Despliegue ejecutado con `deploy-ubuntu.sh deploy`
- [ ] Estado verificado con `deploy-ubuntu.sh status`
- [ ] Logs monitoreados
- [ ] DNS configurado (si aplica)
- [ ] SSL configurado (recomendado)

## 🎉 ¡Listo!

Tu MSP Dashboard está ahora desplegado y funcionando en producción con:
- ✅ Actualización automática de datos
- ✅ Sistema de notificaciones
- ✅ Alertas automáticas
- ✅ Reportes semanales
- ✅ Monitoreo 24/7
- ✅ Backup automático
- ✅ Rollback en caso de problemas
