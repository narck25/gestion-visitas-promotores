"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { login, logout, isAuthenticated, getUserInfo, validateCredentials } from "@/lib/auth";
import { checkServerHealth } from "@/lib/api";
import { AlertCircle, CheckCircle, Loader2, User, LogOut } from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; name: string; role: string } | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setIsLoggedIn(authStatus);
      if (authStatus) {
        setUserInfo(getUserInfo());
      }
    };

    checkAuth();
    
    // Verificar estado del servidor
    const checkServer = async () => {
      try {
        const status = await checkServerHealth();
        setServerStatus(status);
      } catch {
        setServerStatus(false);
      }
    };

    checkServer();
  }, []);

  const handleLogin = async () => {
    // Validar credenciales
    const validation = validateCredentials(loginData.username, loginData.password);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await login(loginData.username, loginData.password);
      
      // Actualizar estado
      setIsLoggedIn(true);
      setUserInfo(getUserInfo());
      setShowLoginForm(false);
      setLoginData({ username: "", password: "" });
      
      console.log("Login exitoso:", response.message);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">VP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Visitas Promotores</h1>
                <p className="text-sm text-gray-600">Aplicación PWA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{userInfo?.name || userInfo?.username}</p>
                      <p className="text-xs text-gray-500">{userInfo?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Gestión de Visitas para <span className="text-blue-600">Promotores de Ventas</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Aplicación PWA moderna para registrar visitas, capturar imágenes y sincronizar datos offline.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-blue-600 text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">PWA Instalable</h3>
              <p className="text-gray-600">
                Instala como app nativa en tu dispositivo móvil. Funciona offline y se sincroniza automáticamente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-green-600 text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Captura de Imágenes</h3>
              <p className="text-gray-600">
                Toma fotos antes y después de cada visita. Geolocalización automática y validación en tiempo real.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-purple-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sincronización Offline</h3>
              <p className="text-gray-600">
                Trabaja sin conexión a internet. Los datos se guardan localmente y se sincronizan cuando hay red.
              </p>
            </div>
          </div>

          {/* PWA Installation Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📲 Instala como App Móvil</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">En Chrome/Edge:</h3>
                <ol className="list-decimal pl-5 text-gray-600 space-y-1">
                  <li>Abre el menú de opciones (⋮)</li>
                  <li>Selecciona "Instalar app" o "Agregar a pantalla de inicio"</li>
                  <li>Confirma la instalación</li>
                </ol>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">En Safari:</h3>
                <ol className="list-decimal pl-5 text-gray-600 space-y-1">
                  <li>Toca el botón de compartir (📤)</li>
                  <li>Desplázate y selecciona "Agregar a pantalla de inicio"</li>
                  <li>Confirma la instalación</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Demo Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/nueva-visita" 
              className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg"
            >
              ➕ Nueva Visita
            </Link>
            <Link 
              href="/visitas" 
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              📋 Ver Visitas
            </Link>
            <Link 
              href="/captura" 
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              📸 Demo Captura
            </Link>
          </div>

          {/* PWA Status */}
          <div className="mt-12 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${serverStatus === true ? 'bg-green-500 animate-pulse' : serverStatus === false ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <p className="text-gray-700">
                <span className="font-semibold">Estado del Servidor:</span> {
                  serverStatus === true ? 'Conectado ✓' : 
                  serverStatus === false ? 'Desconectado ✗' : 
                  'Verificando...'
                }
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-700">
                <span className="font-semibold">Estado PWA:</span> Aplicación instalable y lista para uso offline
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Login */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
              <button
                onClick={() => {
                  setShowLoginForm(false);
                  setError(null);
                  setLoginData({ username: "", password: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Ingresa tu usuario"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Iniciando Sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Usa tus credenciales del sistema para acceder
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Visitas Promotores PWA</h3>
              <p className="text-gray-400">© 2024 - Todos los derechos reservados</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Términos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Soporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}