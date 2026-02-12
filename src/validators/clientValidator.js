const { z } = require('zod');
const { createLogger } = require('../utils/logger');
const { ValidationError } = require('../errors/AppError');

const logger = createLogger({ module: 'validators' });

// Tipos de negocio permitidos
const BusinessType = z.enum([
  'RETAIL',
  'WHOLESALE',
  'SERVICE',
  'MANUFACTURING',
  'AGRICULTURE',
  'TECHNOLOGY',
  'HEALTHCARE',
  'EDUCATION',
  'HOSPITALITY',
  'OTHER',
]);

// Categorías de cliente
const ClientCategory = z.enum([
  'COMERCIO',
  'SERVICIO',
  'INDUSTRIA',
  'AGRICULTURA',
  'TECNOLOGIA',
  'SALUD',
  'EDUCACION',
  'OTRO',
]);

// Esquemas base
const BaseClientSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  businessName: z.string()
    .max(200, 'El nombre comercial no puede exceder 200 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]{7,20}$/, 'Número de teléfono inválido')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  email: z.string()
    .email('Correo electrónico inválido')
    .max(100, 'El correo electrónico no puede exceder 100 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  address: z.string()
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  city: z.string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  state: z.string()
    .max(100, 'El estado no puede exceder 100 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  country: z.string()
    .max(100, 'El país no puede exceder 100 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  postalCode: z.string()
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  businessType: BusinessType
    .optional()
    .nullable()
    .transform(val => val || null),
  
  category: ClientCategory
    .optional()
    .nullable()
    .transform(val => val || null),
  
  notes: z.string()
    .max(2000, 'Las notas no pueden exceder 2000 caracteres')
    .optional()
    .nullable()
    .transform(val => val || null),
  
  promoterId: z.string()
    .uuid('ID de promotor inválido')
    .optional()
    .nullable()
    .transform(val => val || null),
});

// Esquema para creación de cliente
const CreateClientSchema = BaseClientSchema.extend({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
}).strict();

// Esquema para actualización de cliente
const UpdateClientSchema = BaseClientSchema.partial().strict();

// Esquema para filtros de búsqueda
const ClientFilterSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'La página debe ser un número')
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10)),
  
  limit: z.string()
    .regex(/^\d+$/, 'El límite debe ser un número')
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10)),
  
  search: z.string()
    .max(100, 'La búsqueda no puede exceder 100 caracteres')
    .optional()
    .default(''),
  
  promoterId: z.string()
    .uuid('ID de promotor inválido')
    .optional()
    .nullable(),
  
  businessType: BusinessType
    .optional(),
  
  category: ClientCategory
    .optional(),
  
  isActive: z.string()
    .regex(/^(true|false)$/, 'isActive debe ser true o false')
    .optional()
    .transform(val => val === 'true'),
  
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'businessType'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Esquema para estadísticas de cliente
const ClientStatsFilterSchema = z.object({
  promoterId: z.string()
    .uuid('ID de promotor inválido')
    .optional()
    .nullable(),
  
  startDate: z.string()
    .datetime('Fecha de inicio inválida')
    .optional(),
  
  endDate: z.string()
    .datetime('Fecha de fin inválida')
    .optional(),
  
  businessType: BusinessType
    .optional(),
  
  category: ClientCategory
    .optional(),
});

// Función para validar datos
const validate = (schema) => (data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.debug('Validation failed', {
      schema: schema._def.typeName,
      errors: error.errors,
      data,
    });
    
    // Formatear errores de Zod para nuestro formato
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    throw new ValidationError('Error de validación', formattedErrors);
  }
};

// Función para validar datos de forma segura (no lanza excepción)
const safeValidate = (schema) => (data) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      errors: null,
    };
  } catch (error) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    return {
      success: false,
      data: null,
      errors: formattedErrors,
    };
  }
};

// Middleware para validación de request
const validateRequest = (schema, options = {}) => {
  const {
    source = 'body', // 'body', 'query', 'params', 'headers'
    stripUnknown = true,
  } = options;
  
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      
      // Reemplazar datos validados
      if (stripUnknown) {
        req[source] = validatedData;
      } else {
        req[source] = { ...data, ...validatedData };
      }
      
      // Agregar datos validados al request para acceso fácil
      req.validated = req.validated || {};
      req.validated[source] = validatedData;
      
      next();
    } catch (error) {
      logger.debug('Request validation failed', {
        source,
        path: req.path,
        method: req.method,
        errors: error.errors,
      });
      
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      const validationError = new ValidationError('Error de validación en la solicitud', formattedErrors);
      next(validationError);
    }
  };
};

// Validadores específicos
const clientValidators = {
  // Validación de creación
  create: validate(CreateClientSchema),
  createRequest: validateRequest(CreateClientSchema, { source: 'body' }),
  
  // Validación de actualización
  update: validate(UpdateClientSchema),
  updateRequest: validateRequest(UpdateClientSchema.partial(), { source: 'body' }),
  
  // Validación de filtros
  filter: validate(ClientFilterSchema),
  filterRequest: validateRequest(ClientFilterSchema, { source: 'query' }),
  
  // Validación de estadísticas
  statsFilter: validate(ClientStatsFilterSchema),
  statsFilterRequest: validateRequest(ClientStatsFilterSchema, { source: 'query' }),
  
  // Validación de ID
  id: validate(z.string().uuid('ID inválido')),
  idRequest: validateRequest(z.object({ id: z.string().uuid('ID inválido') }), { source: 'params' }),
  
  // Validación segura
  safeCreate: safeValidate(CreateClientSchema),
  safeUpdate: safeValidate(UpdateClientSchema),
  safeFilter: safeValidate(ClientFilterSchema),
  
  // Esquemas para uso externo
  schemas: {
    CreateClientSchema,
    UpdateClientSchema,
    ClientFilterSchema,
    ClientStatsFilterSchema,
    BusinessType,
    ClientCategory,
  },
  
  // Funciones de utilidad
  validate,
  safeValidate,
  validateRequest,
  
  // Validación de permisos de promotor
  validatePromoterAssignment: (userRole, promoterId, userPromoters = []) => {
    if (!promoterId) return true;
    
    // ADMIN y SUPER_ADMIN pueden asignar a cualquier promotor
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return true;
    }
    
    // SUPERVISOR solo puede asignar a sus promotores
    if (userRole === 'SUPERVISOR') {
      return userPromoters.includes(promoterId);
    }
    
    // PROMOTER solo puede asignar a sí mismo
    if (userRole === 'PROMOTER') {
      return false; // Los promotores no pueden asignar clientes a otros promotores
    }
    
    return false;
  },
  
  // Validación de filtros por rol
  validateRoleFilters: (userRole, userId, filterPromoterId) => {
    const filters = {};
    
    switch (userRole) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        // Pueden filtrar por cualquier promotor o ver todos
        if (filterPromoterId) {
          filters.promoterId = filterPromoterId;
        }
        break;
        
      case 'SUPERVISOR':
        // Solo pueden ver clientes de sus promotores
        // La validación de que el promotor pertenece al supervisor se hace en el servicio
        break;
        
      case 'PROMOTER':
      case 'VIEWER':
        // Solo pueden ver sus propios clientes
        filters.promoterId = userId;
        break;
        
      default:
        // Por defecto, solo sus propios clientes
        filters.promoterId = userId;
    }
    
    return filters;
  },
};

module.exports = clientValidators;