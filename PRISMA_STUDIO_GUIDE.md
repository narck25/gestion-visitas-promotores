# 🚀 Prisma Studio - Guía Rápida

## 🌐 **ACCESO AL STUDIO**
- **URL:** http://localhost:5555
- **Estado:** ✅ Ejecutándose en segundo plano
- **Puerto:** 5555

## 📊 **TABLAS DISPONIBLES**

### **1. 👥 User (Usuarios)**
- **8 usuarios** creados con roles específicos
- **Roles:** SUPER_ADMIN, ADMIN, SUPERVISOR, PROMOTER
- **Contraseña:** `123456` (hash bcrypt)

**Usuarios principales:**
- `superadmin@empresa.com` - SUPER_ADMIN
- `admin@empresa.com` - ADMIN
- `supervisor1@empresa.com` - SUPERVISOR (Promotor 1, Promotor 2)
- `supervisor2@empresa.com` - SUPERVISOR (Promotor 3, Promotor 4)
- `promotor1@empresa.com` - PROMOTER (22 visitas, 5 clientes)
- `promotor2@empresa.com` - PROMOTER (22 visitas, 5 clientes)
- `promotor3@empresa.com` - PROMOTER (17 visitas, 5 clientes)
- `promotor4@empresa.com` - PROMOTER (20 visitas, 5 clientes)

### **2. 🏢 Client (Clientes)**
- **20 clientes** realistas
- **5 clientes por promotor**
- **Datos completos:** Nombre, teléfono, dirección, ciudad, coordenadas

**Tipos de negocios:**
- Restaurantes, farmacias, supermercados
- Talleres mecánicos, ferreterías
- Panaderías, carnicerías, floristerías
- Ópticas, veterinarias, cafeterías

### **3. 📋 Visit (Visitas)**
- **81 visitas** con estados variados
- **Distribución por promotor:**
  - Promotor 1: 22 visitas
  - Promotor 2: 22 visitas
  - Promotor 3: 17 visitas
  - Promotor 4: 20 visitas

**Estados de visita:**
- ✅ **SCHEDULED:** 19 visitas (Programadas)
- 🔄 **IN_PROGRESS:** 20 visitas (En progreso)
- ✅ **COMPLETED:** 11 visitas (Completadas)
- ❌ **CANCELLED:** 20 visitas (Canceladas)
- ⚠️ **NO_SHOW:** 11 visitas (No se presentó)

**Tipos de visita:**
- TRAINING (Capacitación)
- SALES (Ventas)
- DELIVERY (Entrega)
- COMPLAINT (Queja)
- FOLLOW_UP (Seguimiento)
- OTHER (Otro)

### **4. 🔄 RefreshToken (Tokens de refresco)**
- Tabla para manejo de autenticación
- Vacía inicialmente (se llena al hacer login)

## 🔍 **CÓMO NAVEGAR EN PRISMA STUDIO**

### **1. Ver todos los usuarios:**
1. Haz clic en **"User"** en el menú izquierdo
2. Verás la lista de 8 usuarios
3. Haz clic en cualquier usuario para ver detalles

### **2. Ver jerarquía supervisor→promotores:**
1. Ve a **"User"**
2. Filtra por **role = SUPERVISOR**
3. Haz clic en un supervisor
4. Ve a la pestaña **"promoters"** para ver sus promotores

### **3. Ver clientes de un promotor:**
1. Ve a **"User"**
2. Filtra por **role = PROMOTER**
3. Haz clic en un promotor
4. Ve a la pestaña **"clients"** para ver sus 5 clientes

### **4. Ver visitas de un cliente:**
1. Ve a **"Client"**
2. Haz clic en un cliente
3. Ve a la pestaña **"visits"** para ver sus visitas (3-6 por cliente)

### **5. Filtrar visitas por estado:**
1. Ve a **"Visit"**
2. Usa el filtro **status = [ESTADO]**
3. Ejemplo: `status = COMPLETED` para ver 11 visitas completadas

## 🎯 **DATOS DE PRUEBA DISPONIBLES**

### **Para probar login en frontend:**
```bash
Email: promotor1@empresa.com
Password: 123456
```

### **Jerarquía completa:**
```
SUPER_ADMIN
  └── ADMIN
      └── SUPERVISOR 1
          ├── PROMOTER 1 (22 visitas, 5 clientes)
          └── PROMOTER 2 (22 visitas, 5 clientes)
      └── SUPERVISOR 2
          ├── PROMOTER 3 (17 visitas, 5 clientes)
          └── PROMOTER 4 (20 visitas, 5 clientes)
```

### **Datos geográficos reales:**
- **Ciudades mexicanas:** CDMX, Guadalajara, Monterrey, Puebla
- **Coordenadas reales** en México
- **Direcciones completas** con calles y números

## ⚡ **ACCIONES RÁPIDAS**

### **Abrir Prisma Studio:**
```bash
npx prisma studio
```

### **Verificar datos desde terminal:**
```bash
# Ver conteo de datos
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('Usuarios:', c)).finally(() => prisma.\$disconnect())"
```

### **Ejecutar seed nuevamente:**
```bash
npx prisma db seed
```

## 🚨 **NOTAS IMPORTANTES**

1. **Prisma Studio sigue ejecutándose** en segundo plano
2. **No cierres la terminal** donde se ejecuta `npx prisma studio`
3. **Para detenerlo:** Presiona `Ctrl + C` en la terminal
4. **Los datos son persistentes** en la base de datos PostgreSQL
5. **Puedes editar datos** directamente en Prisma Studio

## ✅ **VERIFICACIÓN RÁPIDA**

En Prisma Studio deberías ver:

1. ✅ **User:** 8 registros (filtra por role)
2. ✅ **Client:** 20 registros (5 por promotor)
3. ✅ **Visit:** 81 registros (estados variados)
4. ✅ **RefreshToken:** 0 registros (se llena con login)

---

**🎉 ¡Prisma Studio está listo para explorar todos los datos del sistema!**