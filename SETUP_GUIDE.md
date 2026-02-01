# Guía de Configuración - Backend Gestión de Visitas

## Opción 1: Usar Docker (Recomendado)

### 1. Instalar Docker y Docker Compose
- Descarga Docker Desktop: https://www.docker.com/products/docker-desktop
- Asegúrate de que Docker esté ejecutándose

### 2. Ejecutar con Docker Compose
```bash
# En la raíz del proyecto
docker-compose up -d
```

### 3. Verificar que todo funcione
```bash
# Ver logs
docker-compose logs -f

# Verificar servicios
docker-compose ps

# Health check
curl http://localhost:3001/health
```

### 4. Detener servicios
```bash
docker-compose down
```

## Opción 2: Configurar PostgreSQL Manualmente

### 1. Instalar PostgreSQL
**Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/
- Durante la instalación, recordar la contraseña del usuario `postgres`
- Puerto por defecto: 5432

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Crear base de datos y usuario
```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE gestion_visitas;

-- Crear usuario
CREATE USER app_user WITH PASSWORD 'secure_password123';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE gestion_visitas TO app_user;

-- Salir
\q
```

### 3. Configurar archivo .env
Edita el archivo `.env` con:
```env
DATABASE_URL="postgresql://app_user:secure_password123@localhost:5432/gestion_visitas"
```

### 4. Ejecutar migraciones
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Opcional: Abrir Prisma Studio para ver datos
npx prisma studio
```

### 5. Iniciar servidor
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## Opción 3: Usar SQLite para Desarrollo Rápido

### 1. Modificar schema.prisma
Cambia en `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 2. Actualizar .env
```env
DATABASE_URL="file:./dev.db"
```

### 3. Regenerar y migrar
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Verificación de Funcionamiento

### 1. Health Check
```bash
curl http://localhost:3001/health
```
Respuesta esperada:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "...",
  "environment": "development"
}
```

### 2. Probar registro de usuario
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3. Probar login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Solución de Problemas Comunes

### Error: "Can't reach database server"
- PostgreSQL no está ejecutándose
- Verifica con: `sudo systemctl status postgresql` (Linux) o servicios de Windows
- Puerto 5432 bloqueado: `netstat -an | find "5432"` (Windows)

### Error: "Authentication failed"
- Credenciales incorrectas en `.env`
- Usuario/contraseña incorrectos en PostgreSQL

### Error: "Database does not exist"
- La base de datos no fue creada
- Ejecuta los comandos SQL de creación

### Error: "Permission denied"
- Usuario no tiene permisos en la base de datos
- Otorga permisos con `GRANT ALL PRIVILEGES`

## Comandos Útiles

### Docker
```bash
# Reconstruir imágenes
docker-compose build

# Reiniciar servicios
docker-compose restart

# Ver logs específicos
docker-compose logs backend
docker-compose logs postgres

# Eliminar volúmenes (cuidado: borra datos)
docker-compose down -v
```

### PostgreSQL
```bash
# Conectarse a PostgreSQL
psql -U postgres -d gestion_visitas

# Listar bases de datos
\l

# Listar tablas
\dt

# Salir
\q
```

### Prisma
```bash
# Generar cliente
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Resetear base de datos
npx prisma migrate reset

# Abrir interfaz web
npx prisma studio
```

## Configuración para Producción

### 1. Variables de entorno de producción
```env
NODE_ENV=production
JWT_SECRET=generar-con-openssl-rand-base64-32
DATABASE_URL=postgresql://usuario:contraseña@servidor:5432/gestion_visitas
```

### 2. Usar PM2 para producción
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start src/index.js --name "gestion-visitas"

# Monitorear
pm2 monit

# Logs
pm2 logs gestion-visitas
```

### 3. Configurar Nginx como reverse proxy
```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Seguridad en Producción

1. **Cambiar todas las contraseñas por defecto**
2. **Usar HTTPS** con Let's Encrypt
3. **Configurar firewall** para permitir solo puertos necesarios
4. **Monitorear logs** regularmente
5. **Actualizar dependencias** frecuentemente
6. **Hacer backups** de la base de datos

## Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs` o `npm run dev`
2. Verifica conexión a PostgreSQL
3. Asegúrate de que las variables de entorno sean correctas
4. Revisa que los puertos no estén en uso