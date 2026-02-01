# Backend - Gestión de Visitas de Promotores

Backend API REST para la aplicación de gestión de visitas de promotores, construido con Node.js, Express, PostgreSQL y Prisma.

## 🚀 Características

- **API RESTful** con Express.js
- **Autenticación JWT** con refresh tokens
- **ORM Prisma** para PostgreSQL
- **Estructura profesional** de carpetas
- **Middleware de seguridad**: Helmet, CORS, Rate Limiting
- **Manejo centralizado de errores**
- **Validación de datos** con express-validator
- **Logging** con Morgan
- **Cierre elegante** del servidor

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── app.js          # Configuración de Express
│   └── database.js     # Conexión a Prisma
├── controllers/
│   ├── authController.js    # Controladores de autenticación
│   └── visitController.js   # Controladores de visitas
├── middleware/
│   ├── auth.js         # Middleware de autenticación JWT
│   └── errorHandler.js # Manejo de errores
├── routes/
│   ├── authRoutes.js   # Rutas de autenticación
│   └── visitRoutes.js  # Rutas de visitas
└── index.js            # Punto de entrada
```

## 🛠️ Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 15 o superior
- npm o yarn

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd gestion-visitas-promotores
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Configurar base de datos**
   ```bash
   # Generar cliente Prisma
   npx prisma generate
   
   # Ejecutar migraciones
   npx prisma migrate dev --name init
   ```

5. **Iniciar servidor**
   ```bash
   # Modo desarrollo
   npm run dev
   
   # Modo producción
   npm start
   ```

## 🔧 Configuración de Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_visitas"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Security
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000 # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh-token` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil (protegido)

### Visitas
- `POST /api/visits` - Crear visita (protegido)
- `GET /api/visits` - Listar visitas con paginación (protegido)
- `GET /api/visits/stats` - Estadísticas de visitas (protegido)
- `GET /api/visits/:id` - Obtener visita específica (protegido)
- `PUT /api/visits/:id` - Actualizar visita (protegido)
- `DELETE /api/visits/:id` - Eliminar visita (protegido)

### Salud
- `GET /health` - Verificar estado del servidor
- `GET /` - Información de la API

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación:

1. **Login**: Obtén access token y refresh token
2. **Acceso protegido**: Incluye `Authorization: Bearer <token>` en headers
3. **Refresh**: Usa refresh token para obtener nuevo access token
4. **Logout**: Invalida el refresh token

### Ejemplo de Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## 🗄️ Modelo de Datos

### Usuario (User)
- `id` (String, PK)
- `email` (String, único)
- `password` (String, hashed)
- `name` (String)
- `role` (Enum: ADMIN, MANAGER, PROMOTER)
- `isActive` (Boolean)

### Cliente (Client)
- `id` (String, PK)
- `name` (String)
- `phone` (String, opcional)
- `email` (String, opcional)
- `address` (String, opcional)
- `businessType` (String, opcional)

### Visita (Visit)
- `id` (String, PK)
- `promoterId` (String, FK a User)
- `clientId` (String, FK a Client)
- `date` (DateTime)
- `latitude` (Float, opcional)
- `longitude` (Float, opcional)
- `address` (String, opcional)
- `notes` (String)
- `status` (Enum: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- `photos` (String[])
- `signature` (String, opcional)

## 🧪 Pruebas

### Pruebas manuales con cURL

1. **Registrar usuario**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "promotor@ejemplo.com",
       "password": "password123",
       "name": "Juan Pérez"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "promotor@ejemplo.com",
       "password": "password123"
     }'
   ```

3. **Crear visita (protegido)**
   ```bash
   curl -X POST http://localhost:3001/api/visits \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <tu-token>" \
     -d '{
       "clientId": "cliente-id",
       "notes": "Visita de seguimiento",
       "latitude": 19.4326,
       "longitude": -99.1332
     }'
   ```

## 🐳 Docker (Opcional)

### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gestion_visitas
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://app_user:secure_password@postgres:5432/gestion_visitas
      JWT_SECRET: your-jwt-secret
      NODE_ENV: production

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

## 📊 Monitoreo y Logs

- **Modo desarrollo**: Logs detallados con Morgan
- **Modo producción**: Solo errores
- **Health check**: `/health` endpoint
- **Prisma Studio**: `npx prisma studio` para explorar datos

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Prisma
npm run prisma:generate    # Generar cliente Prisma
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio

# Limpiar node_modules
npm run clean
```

## 🚨 Solución de Problemas

### Error: "Database connection failed"
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en `.env`
- Asegúrate de que la base de datos exista

### Error: "JWT secret not defined"
- Define `JWT_SECRET` en `.env`

### Error: "CORS policy"
- Configura `CORS_ORIGIN` correctamente en `.env`

## 📄 Licencia

MIT

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.