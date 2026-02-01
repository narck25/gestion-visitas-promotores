# Documentación de API - Gestión de Visitas con Imágenes

## 📋 Resumen

Esta API permite a los promotores de ventas registrar visitas a clientes con evidencias fotográficas (antes/después), geolocalización y validaciones básicas.

## 🚀 Endpoints Principales

### **1. Registrar Visita con Imágenes**
**POST** `/api/visits/images`

**Descripción:** Registra una nueva visita con imágenes separadas (antes/después).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (form-data):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `clientId` | String | ✅ | ID del cliente visitado |
| `latitude` | Float | ❌ | Latitud GPS (-90 a 90) |
| `longitude` | Float | ❌ | Longitud GPS (-180 a 180) |
| `notes` | String | ✅ | Notas de la visita |
| `purpose` | String | ❌ | Propósito (SALES, FOLLOW_UP, DELIVERY, TRAINING, COMPLAINT, OTHER) |
| `rating` | Integer | ❌ | Calificación 1-5 |
| `beforePhotos[]` | File[] | ❌ | Fotos ANTES (máx 5, 5MB c/u) |
| `afterPhotos[]` | File[] | ❌ | Fotos DESPUÉS (máx 5, 5MB c/u) |

**Formatos de imagen aceptados:** JPEG, JPG, PNG, GIF, WEBP

**Ejemplo de éxito (201):**
```json
{
  "success": true,
  "message": "Visita registrada exitosamente con imágenes",
  "data": {
    "visit": {
      "id": "clxyz123...",
      "promoterId": "promoter-001",
      "clientId": "client-001",
      "latitude": 19.4326,
      "longitude": -99.1332,
      "notes": "Cliente satisfecho con productos",
      "purpose": "SALES",
      "rating": 5,
      "status": "COMPLETED",
      "date": "2024-01-30T18:30:00.000Z",
      "client": {
        "id": "client-001",
        "name": "Tienda ABC",
        "businessName": "Supermercado ABC",
        "phone": "555-123-4567"
      },
      "beforePhotos": [
        {
          "id": "photo-001",
          "url": "http://localhost:3001/uploads/user_promoter-001/visit_clxyz123.../beforePhotos-123456789.jpg",
          "fileName": "antes1.jpg",
          "type": "BEFORE",
          "caption": "Foto ANTES - antes1.jpg"
        }
      ],
      "afterPhotos": [
        {
          "id": "photo-002",
          "url": "http://localhost:3001/uploads/user_promoter-001/visit_clxyz123.../afterPhotos-987654321.jpg",
          "fileName": "despues1.jpg",
          "type": "AFTER",
          "caption": "Foto DESPUÉS - despues1.jpg"
        }
      ]
    },
    "stats": {
      "beforePhotos": 1,
      "afterPhotos": 1,
      "totalPhotos": 2
    }
  }
}
```

**Errores comunes:**
- `400`: Validaciones fallidas (cliente no existe, coordenadas inválidas, etc.)
- `401`: Token JWT inválido o expirado
- `403`: Usuario no es promotor
- `413`: Archivo demasiado grande (>5MB)
- `415`: Tipo de archivo no soportado

### **2. Obtener Visita con Imágenes**
**GET** `/api/visits/images/:id`

**Descripción:** Obtiene una visita específica con todas sus imágenes.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parámetros URL:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | String | ✅ | ID de la visita |

**Ejemplo de éxito (200):**
```json
{
  "success": true,
  "data": {
    "visit": {
      "id": "clxyz123...",
      "promoterId": "promoter-001",
      "clientId": "client-001",
      "latitude": 19.4326,
      "longitude": -99.1332,
      "notes": "Cliente satisfecho con productos",
      "purpose": "SALES",
      "rating": 5,
      "status": "COMPLETED",
      "date": "2024-01-30T18:30:00.000Z",
      "client": {
        "id": "client-001",
        "name": "Tienda ABC",
        "businessName": "Supermercado ABC",
        "phone": "555-123-4567",
        "email": "tienda@example.com",
        "address": "Av. Principal #123",
        "city": "Ciudad de México",
        "state": "CDMX"
      },
      "beforePhotos": [
        {
          "id": "photo-001",
          "url": "http://localhost:3001/uploads/user_promoter-001/visit_clxyz123.../beforePhotos-123456789.jpg",
          "thumbnailUrl": null,
          "fileName": "antes1.jpg",
          "fileSize": 2048576,
          "type": "BEFORE",
          "caption": "Foto ANTES - antes1.jpg",
          "takenAt": "2024-01-30T18:25:00.000Z",
          "createdAt": "2024-01-30T18:30:00.000Z"
        }
      ],
      "afterPhotos": [
        {
          "id": "photo-002",
          "url": "http://localhost:3001/uploads/user_promoter-001/visit_clxyz123.../afterPhotos-987654321.jpg",
          "thumbnailUrl": null,
          "fileName": "despues1.jpg",
          "fileSize": 1987654,
          "type": "AFTER",
          "caption": "Foto DESPUÉS - despues1.jpg",
          "takenAt": "2024-01-30T18:28:00.000Z",
          "createdAt": "2024-01-30T18:30:00.000Z"
        }
      ]
    }
  }
}
```

### **3. Eliminar Foto**
**DELETE** `/api/visits/images/photos/:photoId`

**Descripción:** Elimina una foto específica (archivo físico + registro en BD).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parámetros URL:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `photoId` | String | ✅ | ID de la foto |

**Ejemplo de éxito (200):**
```json
{
  "success": true,
  "message": "Foto eliminada exitosamente"
}
```

### **4. Agregar Fotos a Visita Existente**
**POST** `/api/visits/images/:visitId/photos`

**Descripción:** Agrega fotos adicionales a una visita existente.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Parámetros URL:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `visitId` | String | ✅ | ID de la visita |

**Body (form-data):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | String | ✅ | "BEFORE" o "AFTER" |
| `caption` | String | ❌ | Descripción opcional |
| `photos[]` | File[] | ✅ | Fotos a agregar (máx 5) |

**Ejemplo de éxito (201):**
```json
{
  "success": true,
  "message": "Fotos before agregadas exitosamente",
  "data": {
    "photos": [
      {
        "id": "photo-003",
        "visitId": "clxyz123...",
        "url": "http://localhost:3001/uploads/user_promoter-001/visit_clxyz123.../photo-987654321.jpg",
        "fileName": "extra1.jpg",
        "fileSize": 1567890,
        "mimeType": "image/jpeg",
        "type": "BEFORE",
        "caption": "BEFORE - extra1.jpg",
        "takenAt": "2024-01-30T19:00:00.000Z",
        "createdAt": "2024-01-30T19:05:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### **5. Estadísticas de Visitas**
**GET** `/api/visits/images/stats/:promoterId?`

**Descripción:** Obtiene estadísticas de visitas con imágenes.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parámetros URL (opcional):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `promoterId` | String | ❌ | ID del promotor (solo para managers/admins) |

**Ejemplo de éxito (200):**
```json
{
  "success": true,
  "data": {
    "promoterId": "promoter-001",
    "stats": {
      "totalVisits": 25,
      "visitsWithPhotos": 20,
      "visitsWithoutPhotos": 5,
      "totalPhotos": 45,
      "beforePhotos": 20,
      "afterPhotos": 25,
      "photosPerVisit": "1.80"
    },
    "monthlyStats": [
      {
        "month": "2024-01",
        "visits": 8
      },
      {
        "month": "2023-12",
        "visits": 7
      },
      {
        "month": "2023-11",
        "visits": 5
      },
      {
        "month": "2023-10",
        "visits": 3
      },
      {
        "month": "2023-09",
        "visits": 2
      }
    ]
  }
}
```

## 🔐 Autenticación

### **1. Registro de Usuario**
**POST** `/api/auth/register`
```json
{
  "email": "promotor@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "555-123-4567"
}
```

### **2. Login**
**POST** `/api/auth/login`
```json
{
  "email": "promotor@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "promoter-001",
      "email": "promotor@example.com",
      "name": "Juan Pérez",
      "role": "PROMOTER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "abc123def456...",
      "expiresIn": "24h"
    }
  }
}
```

### **3. Usar Token en Requests**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 Estructura de Archivos

### **Almacenamiento de Imágenes:**
```
uploads/
├── user_promoter-001/
│   ├── visit_clxyz123.../
│   │   ├── beforePhotos-123456789.jpg
│   │   ├── afterPhotos-987654321.jpg
│   │   └── photo-555666777.jpg
│   └── visit_clyyy456.../
│       └── beforePhotos-888999000.jpg
└── user_promoter-002/
    └── visit_clzzz789.../
        └── afterPhotos-111222333.jpg
```

### **URLs de Archivos:**
```
http://localhost:3001/uploads/user_{userId}/visit_{visitId}/{filename}
```

## 🛡️ Validaciones

### **Coordenadas GPS:**
- Latitud: -90 a 90 grados
- Longitud: -180 a 180 grados
- Opcional: Si se proporciona, debe ser válida

### **Imágenes:**
- **Tamaño máximo:** 5MB por archivo
- **Formatos aceptados:** JPEG, JPG, PNG, GIF, WEBP
- **Máximo por tipo:** 5 fotos "antes" + 5 fotos "después"
- **Mínimo requerido:** Al menos 1 foto (antes o después)

### **Datos Requeridos:**
- `clientId`: Debe existir en la base de datos
- `notes`: No puede estar vacío
- `promoterId`: Obtenido del token JWT

## 🔧 Configuración

### **Variables de Entorno:**
```env
# Servidor
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Uploads
MAX_FILE_SIZE=5242880  # 5MB en bytes
MAX_FILES_PER_REQUEST=10
```

### **Límites de Multer:**
- `fileSize`: 5MB por archivo
- `files`: 10 archivos por request máximo
- `beforePhotos`: 5 fotos máximo
- `afterPhotos`: 5 fotos máximo

## 🧪 Ejemplos de Uso

### **1. cURL - Registrar Visita con Imágenes:**
```bash
curl -X POST http://localhost:3001/api/visits/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "clientId=client-001" \
  -F "latitude=19.4326" \
  -F "longitude=-99.1332" \
  -F "notes=Cliente satisfecho con entrega" \
  -F "purpose=DELIVERY" \
  -F "rating=5" \
  -F "beforePhotos=@/ruta/foto_antes1.jpg" \
  -F "afterPhotos=@/ruta/foto_despues1.jpg"
```

### **2. JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('clientId', 'client-001');
formData.append('notes', 'Visita de seguimiento');
formData.append('beforePhotos', fileInput1.files[0]);
formData.append('afterPhotos', fileInput2.files[0]);

const response = await fetch('http://localhost:3001/api/visits/images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### **3. Python/Requests:**
```python
import requests

url = "http://localhost:3001/api/visits/images"
headers = {"Authorization": f"Bearer {token}"}
files = {
    "beforePhotos": open("foto_antes.jpg", "rb"),
    "afterPhotos": open("foto_despues.jpg", "rb")
}
data = {
    "clientId": "client-001",
    "notes": "Visita de capacitación",
    "purpose": "TRAINING"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

## 🚨 Manejo de Errores

### **Errores Comunes:**
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### **Códigos de Estado:**
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error de validación/solicitud
- `401`: No autenticado
- `403`: Prohibido (permisos insuficientes)
- `404`: Recurso no encontrado
- `413`: Payload demasiado grande
- `415`: Tipo de medio no soportado
- `429`: Demasiadas solicitudes
- `500`: Error interno del servidor

### **Errores de Multer:**
- `LIMIT_FILE_SIZE`: Archivo >5MB
- `LIMIT_FILE_COUNT`: Demasiados archivos
- `LIMIT_UNEXPECTED_FILE`: Campo de archivo no esperado

## 📊 Base de Datos

### **Schema Principal:**
```prisma
model Visit {
  id            String    @id @default(cuid())
  promoterId    String
  clientId      String
  latitude      Float?
  longitude     Float?
  notes         String    @db.Text
  purpose       VisitPurpose @default(SALES)
  rating        Int?      @default(5)
  status        VisitStatus @default(COMPLETED)
  date          DateTime  @default(now())
  
  beforePhotos  Photo[]   @relation("BeforePhotos")
  afterPhotos   Photo[]   @relation("AfterPhotos")
}

model Photo {
 