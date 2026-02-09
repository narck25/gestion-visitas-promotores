# Guía de Migraciones Prisma para Producción

## Problema Actual
El backend devuelve error 500 cuando las tablas de base de datos no existen. Esto ocurre comúnmente en:
- Nuevos despliegues en Coolify
- Bases de datos limpias
- Reinicios de contenedores

## Solución
Ejecutar migraciones de Prisma antes de iniciar la aplicación.

## Comandos Requeridos

### 1. Desarrollo Local
```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init

# Aplicar migraciones
npx prisma migrate deploy
```

### 2. Producción (Coolify)
```bash
# En el Dockerfile o comando de inicio:
npx prisma generate
npx prisma migrate deploy
```

### 3. Verificar estado de base de datos
```bash
npx prisma db pull
npx prisma studio
```

## Configuración para Coolify

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Generar cliente Prisma y aplicar migraciones
RUN npx prisma generate
RUN npx prisma migrate deploy

# Exponer puerto
EXPOSE 3001

# Iniciar aplicación
CMD ["node", "src/index.js"]
```

### Variables de Entorno en Coolify
```
DATABASE_URL=postgresql://usuario:contraseña@host:5432/basedatos
```

## Manejo de Errores en Código

### Error P2021 - Tabla no existe
Cuando Prisma lanza el error `P2021: The table `User` does not exist in the current database.`, la aplicación debe:

1. Loggear el error claramente
2. Devolver respuesta HTTP 503 (Service Unavailable)
3. Indicar que la base de datos necesita migraciones

### Implementación en authController.js
```javascript
if (error.code === 'P2021') {
  return res.status(503).json({
    success: false,
    message: 'Base de datos no inicializada. Ejecute migraciones primero.',
    error: 'Database tables do not exist',
    solution: 'Run: npx prisma migrate deploy'
  });
}
```

## Flujo de Inicialización Recomendado

### 1. Script de Inicio (start.sh)
```bash
#!/bin/bash

# Aplicar migraciones
echo "Aplicando migraciones de base de datos..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "Migraciones aplicadas exitosamente"
  # Iniciar aplicación
  node src/index.js
else
  echo "Error aplicando migraciones"
  exit 1
fi
```

### 2. Health Check Mejorado
El endpoint `/health` debe verificar:
- Conexión a base de datos
- Existencia de tablas básicas
- Estado de migraciones

## Solución de Problemas

### Error: "Database is uninitialized"
```
Solución: Ejecutar en el contenedor:
docker-compose exec app npx prisma migrate deploy
```

### Error: "Prisma Client not generated"
```
Solución: Ejecutar:
npx prisma generate
```

### Error: "Connection refused"
```
Verificar:
1. DATABASE_URL correcta
2. Servicio PostgreSQL ejecutándose
3. Credenciales válidas
```

## Migraciones Existentes

### Migración Inicial
- **Nombre**: `init`
- **Tablas creadas**: User, Client, Visit, RefreshToken
- **Enums**: Role, BusinessType, VisitStatus, VisitPurpose
- **Índices**: Todos los definidos en schema.prisma

## Comandos Útiles

```bash
# Resetear base de datos (solo desarrollo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name add_feature

# Generar solo cliente Prisma
npx prisma generate
```

## Notas de Producción

1. **Nunca usar `prisma migrate dev` en producción** - Solo `prisma migrate deploy`
2. **Backups antes de migraciones** - Siempre hacer backup de la base de datos
3. **Variables de entorno seguras** - No hardcodear credenciales
4. **Logs detallados** - Monitorear logs de migración
5. **Health checks** - Verificar estado después de migraciones