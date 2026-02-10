# Implementación de Perfil de Usuario

## Resumen
Se ha implementado completamente el sistema de perfil de usuario con los siguientes endpoints:

1. **GET `/api/auth/profile`** - Obtener perfil del usuario autenticado
2. **PUT `/api/auth/profile`** - Actualizar perfil del usuario autenticado
3. **Campos editables**: `name`, `phone`, `avatar`
4. **Campo no editable**: `role` (por seguridad)
5. **Validaciones**: Campos requeridos, validación de formato

## Endpoints Implementados

### 1. GET `/api/auth/profile` - Obtener perfil
**Descripción**: Retorna la información del perfil del usuario autenticado.

**Autenticación**: Requiere token JWT válido

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "phone": "string | null",
      "avatar": "string | null",
      "role": "string",
      "isActive": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

### 2. PUT `/api/auth/profile` - Actualizar perfil
**Descripción**: Actualiza los datos del perfil del usuario autenticado.

**Autenticación**: Requiere token JWT válido

**Body (JSON)**:
```json
{
  "name": "string",      // Opcional, no puede estar vacío si se proporciona
  "phone": "string",     // Opcional
  "avatar": "string"     // Opcional
}
```

**Validaciones**:
- Al menos un campo debe ser proporcionado
- `name` no puede estar vacío si se proporciona
- `phone` y `avatar` son opcionales y pueden ser `null`

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "phone": "string | null",
      "avatar": "string | null",
      "role": "string",
      "isActive": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

**Errores comunes**:
- `400`: No se proporcionaron campos para actualizar
- `400`: El nombre no puede estar vacío
- `401`: Token no válido o expirado

## Implementación Técnica

### 1. Controlador (`src/controllers/authController.js`)
Se añadieron dos funciones:

#### `getProfile`
```javascript
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
```

#### `updateProfile`
```javascript
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, avatar } = req.body;

    // Validar que al menos un campo sea proporcionado
    if (!name && !phone && !avatar) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar (name, phone, avatar)'
      });
    }

    // Preparar datos para actualizar
    const updateData = {};
    
    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede estar vacío'
        });
      }
      updateData.name = name.trim();
    }
    
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar ? avatar.trim() : null;
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};
```

### 2. Rutas (`src/routes/authRoutes.js`)
Se añadieron las rutas correspondientes:

```javascript
// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().trim(),
  body('avatar').optional().trim()
];

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);
```

### 3. Esquema de Base de Datos (`prisma/schema.prisma`)
Se actualizó el modelo `User` para incluir los campos `phone` y `avatar`:

```prisma
model User {
  id            String         @id @default(dbgenerated("gen_random_uuid()"))
  email         String         @unique
  password      String
  name          String
  phone         String?        // Nuevo campo
  avatar        String?        // Nuevo campo
  role          String         @default("PROMOTER")
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now()) @db.Timestamp(6)
  updatedAt     DateTime       @default(now()) @updatedAt @db.Timestamp(6)
  refreshTokens RefreshToken[]
  visits        Visit[]

  @@index([email], map: "idx_user_email")
  @@index([role], map: "User_role_idx")
  @@index([isActive], map: "User_isActive_idx")
  @@index([createdAt], map: "User_createdAt_idx")
}
```

## Características de Seguridad

### 1. Protección de Datos Sensibles
- **Role no editable**: El campo `role` no puede ser modificado a través de este endpoint
- **Email no editable**: El campo `email` no puede ser modificado (requeriría verificación)
- **Password no editable**: La contraseña requiere endpoint específico con validaciones de seguridad

### 2. Validaciones
- **Express-Validator**: Validación en capa de rutas
- **Validación en controlador**: Validación adicional de negocio
- **Mensajes claros**: Mensajes de error específicos para cada caso

### 3. Autenticación
- **JWT Required**: Todos los endpoints requieren token válido
- **Middleware `authenticateToken`**: Verifica token y extrae usuario
- **User isolation**: Cada usuario solo puede acceder a su propio perfil

## Ejemplos de Uso

### Ejemplo 1: Obtener perfil
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 2: Actualizar nombre y teléfono
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "phone": "+52 55 1234 5678"
  }'
```

### Ejemplo 3: Actualizar solo avatar
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "https://example.com/avatar.jpg"
  }'
```

### Ejemplo 4: Error - nombre vacío
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": ""
  }'
```

**Respuesta**:
```json
{
  "success": false,
  "message": "El nombre no puede estar vacío"
}
```

### Ejemplo 5: Error - sin campos
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta**:
```json
{
  "success": false,
  "message": "Debe proporcionar al menos un campo para actualizar (name, phone, avatar)"
}
```

## Pruebas Realizadas

### Pruebas Unitarias
1. **GET profile**: Usuario autenticado obtiene su perfil
2. **PUT profile**: Actualización completa (nombre, teléfono, avatar)
3. **PUT partial**: Actualización parcial (solo teléfono)
4. **Validation**: Nombre vacío rechazado
5. **Validation**: Sin campos rechazado

### Pruebas de Integración
1. **Flujo completo**: Login → Get profile → Update profile → Verify update
2. **Seguridad**: Usuario A no puede acceder a perfil de usuario B
3. **Persistencia**: Cambios persisten en base de datos

## Archivos Modificados

1. **`src/controllers/authController.js`**
   - Añadida función `updateProfile`
   - Actualizada función `getProfile` para incluir `phone` y `avatar`

2. **`src/routes/authRoutes.js`**
   - Añadida ruta PUT `/api/auth/profile`
   - Añadidas validaciones `updateProfileValidation`

3. **`prisma/schema.prisma`**
   - Añadidos campos `phone` y `avatar` al modelo `User`
   - Añadidos índices para optimización

4. **`test_profile.js`**
   - Script de pruebas para verificar funcionalidad

## Compatibilidad

### Con Funcionalidades Existentes
- **Autenticación**: Compatible con sistema JWT existente
- **Roles**: Mantiene sistema de roles sin cambios
- **API**: No rompe compatibilidad con clientes existentes

### Con Futuras Mejoras
- **Cambio de email**: Se puede añadir endpoint específico con verificación
- **Cambio de contraseña**: Se puede añadir endpoint específico con validaciones de seguridad
- **Two-factor auth**: Se puede integrar sin afectar perfil básico

## Siguientes Pasos Recomendados

1. **Endpoint para cambiar contraseña**: Con validaciones de seguridad
2. **Endpoint para cambiar email**: Con verificación por correo
3. **Subida de avatares**: Sistema de upload de imágenes
4. **Two-factor authentication**: Añadir capa adicional de seguridad
5. **Historial de cambios**: Auditoría de modificaciones al perfil