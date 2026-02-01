"use client";

import { useState, useEffect } from "react";
import { Camera, MapPin, Save, Upload, Wifi, WifiOff } from "lucide-react";

export default function VisitasPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Obtener ubicación
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("No se pudo obtener la ubicación. Asegúrate de permitir el acceso a GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Manejar captura de fotos
  const handlePhotoCapture = (type: "before" | "after") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Usar cámara trasera en móviles
    input.multiple = true;

    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (type === "before") {
        setBeforePhotos((prev) => [...prev, ...files]);
      } else {
        setAfterPhotos((prev) => [...prev, ...files]);
      }
    };

    input.click();
  };

  // Eliminar foto
  const removePhoto = (type: "before" | "after", index: number) => {
    if (type === "before") {
      setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Enviar visita
  const handleSubmit = async () => {
    if (!clientName.trim()) {
      alert("Por favor ingresa el nombre del cliente");
      return;
    }

    if (!notes.trim()) {
      alert("Por favor ingresa notas de la visita");
      return;
    }

    if (beforePhotos.length === 0 && afterPhotos.length === 0) {
      alert("Por favor captura al menos una foto (antes o después)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría la lógica para enviar al backend
      // Por ahora simulamos un envío exitoso
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert(isOnline ? "✅ Visita registrada exitosamente" : "📱 Visita guardada localmente (se sincronizará cuando haya conexión)");
      
      // Resetear formulario
      setClientName("");
      setNotes("");
      setBeforePhotos([]);
      setAfterPhotos([]);
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al registrar la visita");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">VP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Registrar Visita</h1>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center text-green-600">
                      <Wifi size={14} />
                      <span className="text-sm">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <WifiOff size={14} />
                      <span className="text-sm">Offline</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Información de Cliente */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Información del Cliente</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Juan Pérez - Tienda ABC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas de la Visita *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe los detalles de la visita, productos mostrados, acuerdos, etc."
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📍 Ubicación GPS</h2>
            <button
              onClick={getLocation}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MapPin size={18} />
              <span>Obtener Ubicación</span>
            </button>
          </div>

          {location ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Latitud</p>
                  <p className="font-mono text-lg">{location.lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Longitud</p>
                  <p className="font-mono text-lg">{location.lng.toFixed(6)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Precisión</p>
                  <p className="font-mono">{location.accuracy.toFixed(2)} metros</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Presiona el botón para obtener tu ubicación actual</p>
            </div>
          )}
        </div>

        {/* Fotos Antes */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📸 Fotos Antes</h2>
            <button
              onClick={() => handlePhotoCapture("before")}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Camera size={18} />
              <span>Capturar Foto</span>
            </button>
          </div>

          {beforePhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {beforePhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Antes ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto("before", index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="text-xs text-gray-600 mt-1">
                    {photo.name} ({(photo.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No hay fotos capturadas</p>
              <p className="text-sm">Captura fotos del estado inicial</p>
            </div>
          )}
        </div>

        {/* Fotos Después */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📸 Fotos Después (Opcional)</h2>
            <button
              onClick={() => handlePhotoCapture("after")}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Camera size={18} />
              <span>Capturar Foto</span>
            </button>
          </div>

          {afterPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {afterPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Después ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto("after", index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="text-xs text-gray-600 mt-1">
                    {photo.name} ({(photo.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <Camera size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No hay fotos capturadas</p>
              <p className="text-sm">Captura fotos del resultado final (opcional)</p>
            </div>
          )}
        </div>

        {/* Botón de Envío */}
        <div className="sticky bottom-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center space-x-3 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : isOnline
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            } text-white shadow-lg transition-all`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </>
            ) : isOnline ? (
              <>
                <Upload size={20} />
                <span>Enviar Visita</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Guardar Localmente (Offline)</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            {isOnline ? (
              <p>✅ Los datos se enviarán inmediatamente al servidor</p>
            ) : (
              <p>📱 Los datos se guardarán localmente y se sincronizarán cuando haya conexión</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}