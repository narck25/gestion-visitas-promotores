// Módulo para manejo de visitas e imágenes
import { apiFetch, apiUpload, ApiError } from './api';

// Tipos de datos
export interface Visit {
  id: number;
  clientId: number;
  clientName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitRequest {
  clientId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  notes: string;
}

export interface CreateVisitResponse {
  id: number;
  clientId: number;
  clientName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  notes: string;
  status: string;
  message: string;
}

export interface UploadImageRequest {
  visitId: number;
  type: 'BEFORE' | 'AFTER';
  images: File[];
}

export interface UploadImageResponse {
  id: number;
  visitId: number;
  type: string;
  imageUrl: string;
  message: string;
}

// Función para crear una nueva visita
export async function createVisit(data: CreateVisitRequest): Promise<CreateVisitResponse> {
  try {
    const response = await apiFetch<CreateVisitResponse>('/api/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al crear visita:', apiError.message);
    
    // Manejar errores específicos
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

// Función para subir imágenes de una visita
export async function uploadVisitImages(data: UploadImageRequest): Promise<UploadImageResponse[]> {
  try {
    const formData = new FormData();
    formData.append('visitId', data.visitId.toString());
    formData.append('type', data.type);
    
    // Agregar cada imagen al FormData
    data.images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    const response = await apiUpload<UploadImageResponse[]>('/api/visits/images', formData);
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al subir imágenes:', apiError.message);
    throw apiError;
  }
}

// Función para subir ambas imágenes (antes y después)
export async function uploadBothVisitImages(
  visitId: number,
  beforeImage: File | null,
  afterImage: File | null
): Promise<{ before?: UploadImageResponse; after?: UploadImageResponse }> {
  const results: { before?: UploadImageResponse; after?: UploadImageResponse } = {};
  
  try {
    // Subir imagen ANTES si existe
    if (beforeImage) {
      const beforeResponse = await uploadVisitImages({
        visitId,
        type: 'BEFORE',
        images: [beforeImage],
      });
      results.before = beforeResponse[0];
    }
    
    // Subir imagen DESPUÉS si existe
    if (afterImage) {
      const afterResponse = await uploadVisitImages({
        visitId,
        type: 'AFTER',
        images: [afterImage],
      });
      results.after = afterResponse[0];
    }
    
    return results;
  } catch (error) {
    console.error('Error al subir imágenes de visita:', error);
    throw error;
  }
}

// Función para validar datos de visita
export function validateVisitData(data: {
  clientId?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
}): { isValid: boolean; message: string } {
  
  if (!data.clientId || data.clientId <= 0) {
    return {
      isValid: false,
      message: 'Se requiere un cliente válido',
    };
  }
  
  if (data.latitude === undefined || data.longitude === undefined) {
    return {
      isValid: false,
      message: 'Se requiere ubicación GPS',
    };
  }
  
  if (data.accuracy === undefined || data.accuracy <= 0) {
    return {
      isValid: false,
      message: 'La precisión GPS no es válida',
    };
  }
  
  if (data.notes && data.notes.length > 1000) {
    return {
      isValid: false,
      message: 'Las notas no pueden exceder 1000 caracteres',
    };
  }
  
  return {
    isValid: true,
    message: '',
  };
}

// Función para obtener todas las visitas
export async function getVisits(): Promise<Visit[]> {
  try {
    const visits = await apiFetch<Visit[]>('/api/visits');
    return visits;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al obtener visitas:', apiError.message);
    throw apiError;
  }
}

// Función para obtener una visita por ID
export async function getVisitById(id: number): Promise<Visit> {
  try {
    const visit = await apiFetch<Visit>(`/api/visits/${id}`);
    return visit;
  } catch (error) {
    const apiError = error as ApiError;
    console.error(`Error al obtener visita ${id}:`, apiError.message);
    throw apiError;
  }
}