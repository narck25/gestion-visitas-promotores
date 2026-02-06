// Módulo para manejo de clientes
import { apiFetch, ApiError } from './api';

// Tipos de datos
export interface Client {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientResponse {
  id: number;
  name: string;
  message: string;
}

// Función para obtener todos los clientes
export async function getClients(): Promise<Client[]> {
  try {
    const clients = await apiFetch<Client[]>('/api/clients');
    return clients;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al obtener clientes:', apiError.message);
    throw apiError;
  }
}

// Función para buscar cliente por nombre
export async function findClientByName(name: string): Promise<Client | null> {
  try {
    const clients = await getClients();
    const normalizedSearch = name.toLowerCase().trim();
    
    const foundClient = clients.find(client => 
      client.name.toLowerCase().includes(normalizedSearch)
    );
    
    return foundClient || null;
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    return null;
  }
}

// Función para crear un nuevo cliente
export async function createClient(name: string): Promise<CreateClientResponse> {
  try {
    const response = await apiFetch<CreateClientResponse>('/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al crear cliente:', apiError.message);
    
    // Si el error es de validación (400), mostrar mensajes específicos
    if (apiError.status === 400 && apiError.errors) {
      const validationMessages = Object.values(apiError.errors).flat().join(', ');
      throw {
        ...apiError,
        message: `Error de validación: ${validationMessages}`,
      } as ApiError;
    }
    
    throw apiError;
  }
}

// Función para obtener o crear cliente (búsqueda primero, luego creación si no existe)
export async function getOrCreateClient(name: string): Promise<number> {
  try {
    // Primero buscar si el cliente ya existe
    const existingClient = await findClientByName(name);
    
    if (existingClient) {
      return existingClient.id;
    }
    
    // Si no existe, crear nuevo cliente
    const newClient = await createClient(name);
    return newClient.id;
    
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al obtener/crear cliente:', apiError.message);
    throw apiError;
  }
}

// Función para validar nombre de cliente
export function validateClientName(name: string): { isValid: boolean; message: string } {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      message: 'El nombre del cliente es requerido',
    };
  }
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'El nombre debe tener al menos 2 caracteres',
    };
  }
  
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'El nombre no puede exceder 100 caracteres',
    };
  }
  
  return {
    isValid: true,
    message: '',
  };
}