# 🚀 MSP Dashboard

Dashboard para MSP Manager con reportes de tickets y horas trabajadas.

## 📋 Características

- 📊 Dashboard con estadísticas en tiempo real
- 🎫 Gestión de tickets abiertos y cerrados
- ⏰ Reportes de horas trabajadas
- 📈 Gráficos y métricas visuales
- 🔔 Sistema de notificaciones
- 🤖 Alertas automáticas
- 📋 Reportes semanales automáticos

## 🛠️ Desarrollo Local

### Requisitos Previos

- Node.js 16+ 
- npm 8+

### Inicio Rápido

#### Windows
```bash
# Doble clic en el archivo
start-local.bat

# O desde la línea de comandos
npm run dev
```

#### Linux/Mac
```bash
# Hacer ejecutable y ejecutar
chmod +x start-local.sh
./start-local.sh

# O desde la línea de comandos
npm run dev
```

### Configuración Manual

1. **Instalar dependencias:**
```bash
npm run install-all
```

2. **Configurar variables de entorno:**
```bash
# Copiar archivo de configuración local
cp env.local .env
```

3. **Iniciar servidores:**
```bash
npm run dev
```

### Puertos Utilizados

- **Backend:** Puerto 5001 (http://localhost:5001)
- **Frontend:** Puerto 3001 (http://localhost:3001)
- **Proxy:** Configurado automáticamente

### URLs de Acceso

- **Dashboard:** http://localhost:3001
- **API Backend:** http://localhost:5001/api/
- **Test API:** http://localhost:5001/api/test-simple

## 🚀 Despliegue en Producción

### Ubuntu Server

1. **Preparar servidor:**
```bash
sudo ./prepare-ubuntu.sh
```

2. **Configurar dominio:**
```bash
./configurar-dominio.sh
```

3. **Desplegar:**
```bash
sudo ./deploy-ubuntu.sh deploy
```

### Opciones de Configuración

- **Subdominio:** `msp.tu-dominio.com`
- **Ruta específica:** `tu-dominio.com/msp`
- **Puerto específico:** `tu-dominio.com:5001`

## 📁 Estructura del Proyecto

```
Msp-New/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   └── App.js         # Aplicación principal
│   └── package.json
├── server/                 # Backend Node.js
│   ├── index.js           # Servidor Express
│   └── package.json
├── deploy-ubuntu.sh        # Script de despliegue
├── prepare-ubuntu.sh       # Preparación del servidor
├── configurar-dominio.sh   # Configuración de dominio
├── start-local.bat         # Inicio local Windows
├── start-local.sh          # Inicio local Linux/Mac
└── package.json
```

## 🔧 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Iniciar desarrollo
npm run build            # Construir para producción
npm run install-all      # Instalar todas las dependencias
```

### Producción
```bash
sudo ./deploy-ubuntu.sh status    # Ver estado
sudo ./deploy-ubuntu.sh restart   # Reiniciar servicios
sudo ./deploy-ubuntu.sh rollback  # Rollback si hay problemas
```

## 📊 Monitoreo

### Logs
```bash
# Logs de la aplicación
tail -f /var/log/msp-dashboard/combined.log

# Logs de nginx
tail -f /var/log/nginx/msp-dashboard.access.log

# Logs de PM2
pm2 logs msp-dashboard
```

### Estado del Sistema
```bash
# Ver procesos
pm2 monit

# Ver recursos
htop

# Ver puertos en uso
netstat -tlnp | grep -E ":(80|5001|3001)"
```

## 🚨 Solución de Problemas

### Error de Proxy
```bash
# Verificar que el backend esté corriendo
curl http://localhost:5001/api/test-simple

# Verificar puertos en uso
netstat -tlnp | grep :5001
```

### Error de CORS
- Verificar configuración en `server/index.js`
- Asegurar que `CORS_ORIGIN` esté configurado correctamente

### Error de Dependencias
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte

### Archivos de Configuración Importantes
- `env.local` - Configuración local
- `env.production` - Configuración de producción
- `deploy-ubuntu.sh` - Script de despliegue

### Comandos de Diagnóstico
```bash
# Verificar Node.js
node --version
npm --version

# Verificar puertos
netstat -tlnp | grep -E ":(3001|5001|80)"

# Verificar servicios
pm2 list
systemctl status nginx
```

## 🎉 ¡Listo!

Tu MSP Dashboard está configurado para funcionar tanto en desarrollo local como en producción sin conflictos con otras aplicaciones.

