// Configuración global de API
// Base URL del backend en producción
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Tipos de error
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Función para obtener el token de autenticación
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

// Función para guardar el token de autenticación
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('auth_token', token);
}

// Función para eliminar el token de autenticación (logout)
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('auth_token');
}

// Función principal para hacer peticiones a la API
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  // Configurar headers por defecto
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Agregar token de autenticación si existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Configurar opciones de la petición
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Manejar respuestas no exitosas
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let errors: Record<string, string[]> = {};

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errors = errorData.errors || {};
      } catch {
        // Si no se puede parsear JSON, usar el texto de la respuesta
        const text = await response.text();
        if (text) errorMessage = text;
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        errors,
      };

      // Manejar errores específicos
      if (response.status === 401) {
        // Token inválido o expirado - hacer logout
        removeAuthToken();
        window.location.href = '/';
      }

      throw error;
    }

    // Parsear respuesta JSON
    const data = await response.json();
    return data;
  } catch (error) {
    // Manejar errores de red o de parseo
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        status: 0,
      } as ApiError;
    }
    throw error;
  }
}

// Función para subir archivos (FormData)
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  // Configurar headers para FormData (no incluir Content-Type, el navegador lo hará automáticamente)
  const headers = new Headers(options.headers);

  // Agregar token de autenticación si existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Configurar opciones de la petición
  const fetchOptions: RequestInit = {
    ...options,
    method: 'POST',
    headers,
    body: formData,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        status: 0,
      } as ApiError;
    }
    throw error;
  }
}

// Función para verificar el estado del servidor
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}