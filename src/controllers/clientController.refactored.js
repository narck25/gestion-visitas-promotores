const clientService = require('../services/clientService');
const clientValidators = require('../validators/clientValidator');
const { createLogger } = require('../utils/logger');
const { asyncHandler } = require('../errors/AppError');

const logger = createLogger({ module: 'controllers.client' });

/**
 * Controlador para obtener todos los clientes con filtros por rol
 */
const getAllClients = asyncHandler(async (req, res) => {
  const user = req.user;
  const filters = req.validated?.query || {};
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  };

  // Remover campos de paginación de los filtros
  const { page, limit, sortBy, sortOrder, ...clientFilters } = filters;

  const result = await clientService.getAllClients(user, clientFilters, pagination);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Controlador para crear un nuevo cliente
 */
const createClient = asyncHandler(async (req, res) => {
  const user = req.user;
  const clientData = req.validated?.body || {};

  const client = await clientService.createClient(clientData, user);

  res.status(201).json({
    success: true,
    message: 'Cliente creado exitosamente',
    data: { client },
  });
});

/**
 * Controlador para obtener un cliente específico
 */
const getClientById = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const client = await clientService.getClientById(id, user);

  res.status(200).json({
    success: true,
    data: { client },
  });
});

/**
 * Controlador para actualizar un cliente
 */
const updateClient = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const updateData = req.validated?.body || {};

  const client = await clientService.updateClient(id, updateData, user);

  res.status(200).json({
    success: true,
    message: 'Cliente actualizado exitosamente',
    data: { client },
  });
});

/**
 * Controlador para eliminar un cliente (soft delete)
 */
const deleteClient = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { hardDelete = false } = req.query;

  await clientService.deleteClient(id, user, hardDelete === 'true');

  res.status(200).json({
    success: true,
    message: hardDelete === 'true' 
      ? 'Cliente eliminado permanentemente' 
      : 'Cliente desactivado exitosamente',
  });
});

/**
 * Controlador para restaurar un cliente (soft delete revertido)
 */
const restoreClient = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const client = await clientService.restoreClient(id, user);

  res.status(200).json({
    success: true,
    message: 'Cliente restaurado exitosamente',
    data: { client },
  });
});

/**
 * Controlador para obtener estadísticas de clientes
 */
const getClientStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const filters = req.validated?.query || {};

  const stats = await clientService.getClientStats(user, filters);

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * Controlador para obtener clientes por promotor
 */
const getClientsByPromoter = asyncHandler(async (req, res) => {
  const user = req.user;
  const { promoterId } = req.params;
  const filters = req.validated?.query || {};
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  };

  // Remover campos de paginación de los filtros
  const { page, limit, sortBy, sortOrder, ...clientFilters } = filters;

  const result = await clientService.getClientsByPromoter(
    promoterId, 
    user, 
    clientFilters, 
    pagination
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Controlador para obtener clientes por supervisor
 */
const getClientsBySupervisor = asyncHandler(async (req, res) => {
  const user = req.user;
  const { supervisorId } = req.params;
  const filters = req.validated?.query || {};
  const pagination = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  };

  // Remover campos de paginación de los filtros
  const { page, limit, sortBy, sortOrder, ...clientFilters } = filters;

  const result = await clientService.getClientsBySupervisor(
    supervisorId, 
    user, 
    clientFilters, 
    pagination
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Controlador para verificar si cliente existe
 */
const clientExists = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exists = await clientService.clientExists(id);

  res.status(200).json({
    success: true,
    data: { exists },
  });
});

/**
 * Controlador para verificar si cliente pertenece al usuario
 */
const clientBelongsToUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const belongs = await clientService.clientBelongsToUser(id, user);

  res.status(200).json({
    success: true,
    data: { belongs },
  });
});

module.exports = {
  getAllClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  restoreClient,
  getClientStats,
  getClientsByPromoter,
  getClientsBySupervisor,
  clientExists,
  clientBelongsToUser,
};