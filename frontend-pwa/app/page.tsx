import Image from "next/image";
import Link from "next/link";

export default function Home() {
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Iniciar Sesión
              </button>
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
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-700">
                <span className="font-semibold">Estado PWA:</span> Aplicación instalable y lista para uso offline
              </p>
            </div>
          </div>
        </div>
      </main>

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