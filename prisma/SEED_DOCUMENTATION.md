# 🌱 SEED DE BASE DE DATOS PARA GESTIÓN DE VISITAS

## 📋 RESUMEN

Este seed permite poblar la base de datos con datos coherentes y realistas para probar todas las funcionalidades del sistema, especialmente:

* **Asignación supervisor → promotores**
* **Asignación promotores → clientes**
* **Creación de visitas**
* **Funcionalidad "Mis visitas" del frontend**

## 🎯 ESTRUCTURA DE DATOS CREADA

### **USUARIOS (8 total):**
```
1 SUPER_ADMIN
1 ADMIN
2 SUPERVISOR
4 PROMOTER (2 por cada supervisor)
```

### **CLIENTES (20 total):**
```
5 clientes por cada promotor (4 promotores × 5 = 20 clientes)
```

### **VISITAS (60-120 total):**
```
3-6 visitas por cada cliente (20 clientes × 3-6 = 60-120 visitas)
```

## 🔑 CREDENCIALES PARA LOGIN

**Email:** Cualquier usuario creado (ejemplos):
- `superadmin@empresa.com` (SUPER_ADMIN)
- `admin@empresa.com` (ADMIN)
- `supervisor1@empresa.com` (SUPERVISOR)
- `supervisor2@empresa.com` (SUPERVISOR)
- `promotor1@empresa.com` (PROMOTER)
- `promotor2@empresa.com` (PROMOTER)
- `promotor3@empresa.com` (PROMOTER)
- `promotor4@empresa.com` (PROMOTER)

**Password:** `123456` (para todos los usuarios)

## 🚀 CÓMO EJECUTAR EL SEED

### **Opción 1: Usando comando de Prisma (Recomendado)**
```bash
npx prisma db seed
```

### **Opción 2: Ejecutar directamente**
```bash
node prisma/seed.js
```

### **Opción 3: Con migración**
```bash
# Si necesitas resetear la base de datos completamente
npx prisma migrate reset
```

## 📊 DATOS REALISTAS INCLUIDOS

### **CIUDADES MEXICANAS:**
- Ciudad de México, Guadalajara, Monterrey, Puebla, Tijuana, León, Querétaro, Mérida, Cancún, Acapulco

### **TIPOS DE NEGOCIO:**
- RETAIL, WHOLESALE, SERVICE, MANUFACTURING, FOOD, OTHER

### **NOMBRES DE NEGOCIOS REALISTAS:**
- Supermercado La Esperanza
- Farmacias del Ahorro
- Tienda de Abarrotes Don José
- Restaurante El Mexicano
- Papelería y Regalos
- Taller Mecánico Rápido
- Lavandería Express
- Cafetería Central
- Ferretería El Constructor
- Mueblería Moderna
- Óptica Visión Clara
- Veterinaria Mascotas Felices
- Florería Primavera
- Panadería El Buen Pan
- Carnicería La Especial

### **ESTADOS DE VISITA:**
- SCHEDULED (Programada)
- IN_PROGRESS (En progreso)
- COMPLETED (Completada)
- CANCELLED (Cancelada)
- NO_SHOW (No se presentó)

### **PROPÓSITOS DE VISITA:**
- SALES (Ventas)
- FOLLOW_UP (Seguimiento)
- DELIVERY (Entrega)
- TRAINING (Capacitación)
- COMPLAINT (Queja)
- OTHER (Otro)

## 🔍 JERARQUÍA IMPLEMENTADA

### **NIVEL 1: SUPER_ADMIN**
```
superadmin@empresa.com
└── Acceso completo a todo el sistema
```

### **NIVEL 2: ADMIN**
```
admin@empresa.com
└── Administración general
```

### **NIVEL 3: SUPERVISORES**
```
supervisor1@empresa.com
├── promotor1@empresa.com
└── promotor2@empresa.com

supervisor2@empresa.com
├── promotor3@empresa.com
└── promotor4@empresa.com
```

### **NIVEL 4: PROMOTORES**
```
Cada promotor tiene:
├── 5 clientes asignados
└── Cada cliente tiene 3-6 visitas
```

## 📈 EJEMPLOS DE DATOS GENERADOS

### **CLIENTE TÍPICO:**
```json
{
  "name": "Cliente 1",
  "businessName": "Supermercado La Esperanza",
  "phone": "+525512345678",
  "email": "cliente1@empresa.com",
  "address": "Av. Principal 123, Col. Centro, Ciudad de México",
  "city": "Ciudad de México",
  "state": "Estado",
  "country": "México",
  "postalCode": "12345",
  "businessType": "RETAIL",
  "category": "General",
  "promoterId": "uuid-del-promotor",
  "isActive": true
}
```

### **VISITA TÍPICA:**
```json
{
  "promoterId": "uuid-del-promotor",
  "clientId": "uuid-del-cliente",
  "date": "2024-01-15T10:30:00.000Z",
  "duration": 90,
  "latitude": 19.432608,
  "longitude": -99.133209,
  "address": "Av. Principal 123, Col. Centro, Ciudad de México",
  "accuracy": 12.5,
  "status": "COMPLETED",
  "purpose": "SALES",
  "notes": "Cliente satisfecho con el producto, mostró interés en nueva línea",
  "rating": 5,
  "beforePhotos": ["https://example.com/photos/visit1-before.jpg"],
  "afterPhotos": ["https://example.com/photos/visit1-after.jpg"],
  "signature": "firma_1.png",
  "signedAt": "2024-01-15T12:00:00.000Z"
}
```

## 🧪 ESCENARIOS DE PRUEBA HABILITADOS

### **1. LOGIN Y AUTENTICACIÓN:**
- Iniciar sesión con cualquier promotor
- Ver perfil de usuario
- Cerrar sesión

### **2. "MIS VISITAS" (Frontend):**
- Cada promotor ve SOLO sus visitas
- Filtrado por estado (COMPLETED, SCHEDULED, etc.)
- Visualización de detalles completos

### **3. JERARQUÍA SUPERVISOR-PROMOTOR:**
- Supervisor puede ver visitas de sus promotores
- Promotor solo ve sus propias visitas
- Asignación correcta de clientes

### **4. DATOS GEOGRÁFICOS:**
- Coordenadas reales en México
- Direcciones completas
- Precisión de ubicación

### **5. MULTIMEDIA:**
- Fotos antes/después (URLs de ejemplo)
- Firmas digitales para visitas completadas

## 🔧 CONFIGURACIÓN TÉCNICA

### **ORDEN DE LIMPIEZA:**
1. `RefreshToken` (depende de User)
2. `Visit` (depende de Client y User)
3. `Client` (depende de User)
4. `User` (base de la jerarquía)

### **HASH DE CONTRASEÑAS:**
```javascript
const passwordHash = await bcrypt.hash('123456', 10);
// Compatible con sistema de autenticación existente
```

### **COORDENADAS REALES:**
- Latitud: 14.5°N a 32.5°N (territorio mexicano)
- Longitud: -118.4°W a -86.7°W (territorio mexicano)
- Precisión: 5-20 metros

### **FECHAS REALISTAS:**
- Visitas pasadas: últimos 30 días
- Visitas programadas: próximos 30 días
- Duración: 30-150 minutos

## 🚨 CONSIDERACIONES IMPORTANTES

### **NO SE MODIFICÓ:**
- ✅ Schema de Prisma (schema.prisma)
- ✅ Controllers
- ✅ Rutas
- ✅ Validaciones
- ✅ Lógica de negocio
- ✅ Autenticación existente

### **COMPATIBILIDAD TOTAL:**
- ✅ Frontend "Mis visitas" funciona sin cambios
- ✅ Login con bcrypt funciona igual
- ✅ API responde igual que antes
- ✅ Relaciones de base de datos intactas

### **DATOS TEMPORALES:**
- Las URLs de fotos son de ejemplo (`https://example.com/...`)
- Las firmas son nombres de archivo de ejemplo
- Los emails usan dominio `@empresa.com`

## 📝 COMANDOS ÚTILES

### **Ver datos en Prisma Studio:**
```bash
npx prisma studio
```

### **Ejecutar seed después de migración:**
```bash
npx prisma migrate dev
npx prisma db seed
```

### **Resetear completamente:**
```bash
npx prisma migrate reset
# Esto ejecutará automáticamente el seed
```

### **Verificar conexión a base de datos:**
```bash
npx prisma db pull
```

## 🎯 RESULTADO ESPERADO

Después de ejecutar el seed, podrás:

1. **Iniciar sesión** con `promotor1@empresa.com` / `123456`
2. **Ver "Mis visitas"** con 15-30 visitas reales (5 clientes × 3-6 visitas)
3. **Probar filtros** por estado (COMPLETED, SCHEDULED, etc.)
4. **Ver detalles completos** de cada visita
5. **Probar jerarquía** iniciando sesión como supervisor

## 🔄 RE-EJECUTAR EL SEED

Si necesitas datos frescos:

```bash
# Opción 1: Reset completo
npx prisma migrate reset

# Opción 2: Solo seed (si ya hay datos)
node prisma/seed.js
# Nota: Esto borrará todos los datos existentes primero
```

## 📞 SOPORTE

El seed está diseñado para:
- ✅ **Desarrollo local**
- ✅ **Pruebas de integración**
- ✅ **Demostraciones**
- ✅ **Testing de frontend**

**No usar en producción** ya que usa contraseñas conocidas y datos de ejemplo.

---

**🎉 ¡Listo para probar! Ejecuta `npx prisma db seed` y comienza a explorar el sistema con datos realistas.**