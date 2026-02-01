# Flujo Frontend - Registro de Visitas para Promotores

## 🎯 Objetivo
Crear una experiencia simple y guiada para que los promotores registren visitas con GPS y fotos antes/después.

## 📋 Flujo de Usuario

### 1. **Inicio de Visita**
- El promotor ve la pantalla principal con el botón "Nueva Visita"
- Al hacer clic, inicia el flujo guiado paso a paso

### 2. **Paso 1: Datos Básicos**
- Seleccionar cliente/tienda (dropdown o búsqueda)
- Agregar notas opcionales
- Botón "Siguiente" habilitado cuando se complete

### 3. **Paso 2: Ubicación GPS**
- Se obtiene automáticamente la ubicación GPS al entrar a este paso
- Se muestra un indicador de carga mientras se obtiene
- Se muestra la ubicación obtenida (lat, lng, precisión)
- Si falla, mostrar error claro y opción de reintentar
- Botón "Siguiente" habilitado cuando GPS esté listo

### 4. **Paso 3: Foto ANTES**
- Título claro: "Toma la foto ANTES de la visita"
- Botón grande para activar cámara
- Preview de la foto capturada
- Opción para retomar si no está satisfecho
- Botón "Siguiente" habilitado cuando foto esté capturada

### 5. **Paso 4: Foto DESPUÉS**
- Título claro: "Toma la foto DESPUÉS de la visita"
- Botón grande para activar cámara
- Preview de la foto capturada
- Opción para retomar si no está satisfecho
- Botón "Siguiente" habilitado cuando foto esté capturada

### 6. **Paso 5: Resumen y Confirmación**
- Mostrar resumen de toda la información:
  - Cliente/tienda
  - Ubicación GPS
  - Foto ANTES (thumbnail)
  - Foto DESPUÉS (thumbnail)
  - Notas (si las hay)
- Botones: "Editar" (volver atrás) y "Enviar Visita"

### 7. **Envío a la API**
- Mostrar indicador de carga durante el envío
- Preparar FormData con todos los datos
- Enviar a la API con manejo de errores

### 8. **Resultado**
- **Éxito:** Pantalla de confirmación con checkmark verde
  - Mensaje: "¡Visita registrada exitosamente!"
  - Botón: "Registrar Nueva Visita" o "Volver al Inicio"
  
- **Error:** Pantalla de error con información clara
  - Mensaje descriptivo del error
  - Opciones: "Reintentar" o "Guardar en Borrador" (para envío offline)

## 🔄 Navegación entre Pasos

- Indicador visual del progreso (1/5, 2/5, etc.)
- Breadcrumbs o stepper para ver en qué paso están
- Opción de volver atrás para corregir
- No permitir saltar pasos adelante

## 🎨 Principios de UX

1. **Simplicidad:** Un solo objetivo por pantalla
2. **Feedback Visual:** Indicadores claros de carga y éxito/error
3. **Prevención de Errores:** Validar datos antes de permitir avanzar
4. **Claridad:** Instrucciones claras en cada paso
5. **Confianza:** Mostrar resumen antes de enviar

## 🛡️ Manejo de Errores

### Errores de GPS:
- "No se pudo obtener tu ubicación. Por favor habilita el GPS."
- "Ubicación no disponible. Intenta de nuevo."
- Botón claro para reintentar

### Errores de Cámara:
- "No se pudo acceder a la cámara. Por favor permite el acceso."
- "Error al capturar la foto. Intenta de nuevo."
- Opción para seleccionar de galería como alternativa

### Errores de Conexión:
- "Sin conexión a internet. La visita se guardó localmente."
- "Error al enviar. ¿Deseas reintentar?"
- Opción de guardar en borrador para envío posterior

### Errores del Servidor:
- "Error del servidor. Por favor intenta más tarde."
- Mostrar el código de error si está disponible
- Opción de contactar soporte

## 💾 Funcionalidades Adicionales

1. **Guardar en Borrador:** Si el usuario abandona el flujo, guardar progreso
2. **Modo Offline:** Permitir completar el flujo sin conexión y sincronizar después
3. **Historial:** Ver visitas enviadas recientemente
4. **Validaciones:** Verificar que las fotos sean diferentes (antes vs después)

## 🚀 Tecnologías

- **Next.js 14+** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Lucide Icons** para iconografía
- **Local Storage** para guardar borradores
- **Service Worker** para funcionalidad offline
