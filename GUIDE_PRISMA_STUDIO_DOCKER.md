# Guía para usar Prisma Studio con Docker

## Problema Actual
Prisma Studio muestra el error: "Error in Prisma Client request" porque PostgreSQL no está corriendo.

## Solución Paso a Paso

### Paso 1: Verificar Docker Desktop
1. Abre Docker Desktop desde el menú de inicio o la bandeja del sistema
2. Espera a que el ícono de Docker en la bandeja del sistema muestre "Docker Desktop is running"
3. Esto puede tomar 1-2 minutos después de iniciar

### Paso 2: Iniciar PostgreSQL
Una vez que Docker Desktop esté completamente iniciado:

**Opción A: Usar el script batch**
```cmd
.\start-postgres.bat
```

**Opción B: Comandos manuales**
```cmd
# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Verificar que PostgreSQL esté listo
docker-compose exec postgres pg_isready -U app_user -d gestion_visitas
```

### Paso 3: Crear las tablas de la base de datos
```cmd
npx prisma migrate dev
```

Cuando te pregunte por el nombre de la migración, puedes usar:
```
init
```

### Paso 4: Ejecutar Prisma Studio
```cmd
npx prisma studio
```

### Paso 5: Acceder a Prisma Studio
1. Abre tu navegador web
2. Ve a: http://localhost:5555
3. Deberías ver la interfaz de Prisma Studio con todas las tablas

## Solución Alternativa Rápida

Si Docker sigue teniendo problemas, puedes usar temporalmente la versión del servidor sin base de datos:

```cmd
.\start-server-no-db.bat
```

Esta versión:
- No requiere PostgreSQL
- Usa datos mock para pruebas
- Funciona inmediatamente
- API disponible en http://localhost:3001

## Comandos Útiles

### Verificar estado de Docker
```cmd
docker version
docker ps
```

### Verificar estado de PostgreSQL
```cmd
# Verificar si el contenedor está corriendo
docker-compose ps

# Verificar conexión a PostgreSQL
docker-compose exec postgres pg_isready -U app_user -d gestion_visitas
```

### Reiniciar servicios
```cmd
# Detener todos los servicios
docker-compose down

# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
timeout /t 10
```

### Limpiar y reiniciar
```cmd
# Detener y eliminar contenedores
docker-compose down -v

# Reconstruir e iniciar
docker-compose up -d --build
```

## Solución de Problemas

### Error: "Docker Desktop is not running"
1. Cierra Docker Desktop completamente
2. Reinicia Docker Desktop
3. Espera 2-3 minutos a que se inicialice completamente

### Error: "Can't reach database server at localhost:5432"
1. Verifica que PostgreSQL esté corriendo: `docker-compose ps`
2. Si no está corriendo: `docker-compose up -d postgres`
3. Espera 10 segundos y verifica: `docker-compose exec postgres pg_isready`

### Error en Prisma Studio: "Error in Prisma Client request"
1. Asegúrate de que PostgreSQL esté corriendo
2. Ejecuta migraciones: `npx prisma migrate dev`
3. Reinicia Prisma Studio: `npx prisma studio`

## Estado Actual de los Servicios

- ✅ **Prisma Studio**: http://localhost:5555 (pero muestra error por falta de PostgreSQL)
- ✅ **Servidor backend (sin DB)**: http://localhost:3001 (funcionando)
- ⚠️ **PostgreSQL**: No corriendo (necesita Docker Desktop completamente iniciado)

## Contacto para Soporte
Si los problemas persisten, revisa la documentación en `PRISMA_STUDIO_GUIDE.md` o contacta al equipo de desarrollo.