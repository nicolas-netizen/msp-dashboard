# MSP Dashboard

Dashboard completo para gestión de tickets y horas de MSP Manager, con análisis en tiempo real y reportes detallados.

## 🚀 Características

- **Dashboard Principal**: Estadísticas en tiempo real de tickets y horas
- **Gestión de Tickets**: Tickets abiertos y cerrados con filtros avanzados
- **Tabla de Horas**: Vista detallada de horas por técnico (similar a MSP Manager)
- **Reportes de Cliente**: Análisis de actividad por cliente
- **API Integrada**: Conexión directa con MSP Manager API

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: React + Tailwind CSS
- **Base de Datos**: MSP Manager API (OData)
- **Gráficos**: Recharts
- **Iconos**: Lucide React

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn
- Acceso a MSP Manager API
- API Key de MSP Manager

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/msp-dashboard.git
cd msp-dashboard
```

### 2. Instalar dependencias
```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client
npm install
cd ..
```

### 3. Configurar variables de entorno
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env

# Editar .env con tus credenciales
MSP_API_URL=https://api.mspmanager.com
MSP_API_KEY=tu-api-key-aqui
NODE_ENV=development
```

### 4. Ejecutar en desarrollo
```bash
# Ejecutar servidor y cliente simultáneamente
npm run dev

# O ejecutar por separado:
npm run server    # Backend en puerto 5000
npm run client    # Frontend en puerto 3000
```

## 🌐 Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Dashboard**: http://localhost:3000
- **Horas**: http://localhost:3000/hours

## 📊 Endpoints de la API

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/weekly-activity` - Actividad semanal
- `GET /api/dashboard/top-clients` - Top clientes

### Tickets
- `GET /api/tickets/open` - Tickets abiertos
- `GET /api/tickets/closed` - Tickets cerrados

### Horas
- `GET /api/hours/technicians-table` - Tabla de horas por técnico

## 🚀 Despliegue en Producción

### 1. Build de producción
```bash
cd client
npm run build
cd ..
```

### 2. Configurar PM2
```bash
npm install -g pm2
pm2 start server/index.js --name "msp-backend"
pm2 start "npm start" --cwd "./client" --name "msp-frontend"
pm2 startup
pm2 save
```

### 3. Configurar Nginx (opcional)
```bash
sudo apt install nginx
# Configurar nginx para servir el build de React
```

## 🔧 Configuración

### Variables de Entorno
```bash
NODE_ENV=production
PORT=5000
MSP_API_URL=https://api.mspmanager.com
MSP_API_KEY=tu-api-key
```

### Puertos
- **Backend**: 5000
- **Frontend**: 3000
- **Producción**: Configurable

## 📱 Funcionalidades

### Dashboard Principal
- Total de tickets abiertos/cerrados
- Horas trabajadas (reales vs. facturables)
- Clientes activos
- Gráficos de actividad semanal

### Gestión de Horas
- Tabla de técnicos con fechas
- Horas por día por técnico
- Colores inteligentes (verde ≥6h, amarillo <6h)
- Totales por técnico

### Reportes
- Análisis por cliente
- Estadísticas de tickets
- Actividad temporal

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/msp-dashboard/issues)
- **Email**: tu-email@ejemplo.com

## 🔄 Changelog

### v1.0.0
- Dashboard principal funcional
- Gestión de tickets
- Tabla de horas por técnico
- Integración con MSP Manager API
- Reportes de cliente

---

**Desarrollado con ❤️ para MSP Manager**

