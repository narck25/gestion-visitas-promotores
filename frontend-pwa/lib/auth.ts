// Módulo de autenticación
import { apiFetch, setAuthToken, removeAuthToken, ApiError } from './api';

// Tipos de datos
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  message: string;
}

// Función para iniciar sesión
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Guardar token en localStorage
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error al iniciar sesión:', apiError.message);
    
    // Manejar errores específicos
    if (apiError.status === 401) {
      throw {
        ...apiError,
        message: 'Usuario o contraseña incorrectos',
      } as ApiError;
    }
    
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

// Función para cerrar sesión
export function logout(): void {
  removeAuthToken();
  // Redirigir a la página principal
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('auth_token');
  return !!token;
}

// Función para obtener información del usuario desde el token
export function getUserInfo(): { username: string; name: string; role: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }
  
  try {
    // Decodificar el token JWT (parte del payload)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    return {
      username: decoded.email || '',
      name: decoded.name || '',
      role: decoded.role || 'user',
    };
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
}

// Función para validar credenciales
export function validateCredentials(username: string, password: string): { isValid: boolean; message: string } {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  
  if (!trimmedUsername) {
    return {
      isValid: false,
      message: 'El nombre de usuario es requerido',
    };
  }
  
  if (!trimmedPassword) {
    return {
      isValid: false,
      message: 'La contraseña es requerida',
    };
  }
  
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      message: 'El nombre de usuario debe tener al menos 3 caracteres',
    };
  }
  
  if (trimmedPassword.length < 6) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 6 caracteres',
    };
  }
  
  return {
    isValid: true,
    message: '',
  };
}

// Función para verificar si el token es válido (haciendo una petición al servidor)
export async function validateToken(): Promise<boolean> {
  try {
    // Intentar hacer una petición que requiera autenticación
    await apiFetch('/api/clients');
    return true;
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 401) {
      return false;
    }
    // Otros errores podrían ser de conexión, no necesariamente token inválido
    return true;
  }
}