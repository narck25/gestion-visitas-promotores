 "use client";

import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Upload, X, RotateCw, CheckCircle, AlertCircle } from "lucide-react";

export default function CapturaPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoadingLocation(false);
        setSuccess("📍 Ubicación obtenida exitosamente");
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        let errorMessage = "No se pudo obtener la ubicación";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor habilita el GPS en tu dispositivo.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación.";
            break;
        }
        
        setError(errorMessage);
        setIsLoadingLocation(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta acceso a la cámara");
      return;
    }

    setIsLoadingCamera(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLoadingCamera(false);
      setSuccess("📸 Cámara activada. Presiona 'Capturar Foto' para tomar una imagen.");
    } catch (err) {
      console.error("Error accediendo a la cámara:", err);
      setError("No se pudo acceder a la cámara. Asegúrate de permitir el acceso.");
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `foto_${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        const photoUrl = URL.createObjectURL(blob);
        setPhoto(photoUrl);
        setPhotoFile(file);
        setSuccess("✅ Foto capturada exitosamente");
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  const selectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen válido");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("La imagen es demasiado grande. Máximo 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
        setPhotoFile(file);
        setSuccess("✅ Foto seleccionada exitosamente");
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoFile(null);
    if (photo) {
      URL.revokeObjectURL(photo);
    }
    stopCamera();
  };

  const prepareDataForAPI = () => {
    if (!location) {
      setError("Por favor obtén tu ubicación primero");
      return null;
    }

    if (!photoFile) {
      setError("Por favor captura o selecciona una foto");
      return null;
    }

    const formData = new FormData();
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("accuracy", location.accuracy.toString());
    formData.append("timestamp", new Date().toISOString());
    formData.append("photo", photoFile);

    return formData;
  };

  const handleSubmit = async () => {
    const formData = prepareDataForAPI();
    if (!formData) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Datos preparados para envío:", {
        latitude: formData.get("latitude"),
        longitude: formData.get("longitude"),
        accuracy: formData.get("accuracy"),
        timestamp: formData.get("timestamp"),
        photo: photoFile?.name,
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess("🎉 Datos preparados para envío. Listo para conectar con tu API.");
      
      console.log("FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

    } catch (err) {
      console.error("Error preparando envío:", err);
      setError("❌ Error al preparar los datos para envío");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (photo) {
        URL.revokeObjectURL(photo);
      }
      stopCamera();
    };
  }, [photo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Captura con GPS</h1>
                <p className="text-sm text-gray-600">PWA para móvil</p>
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              Geolocalización
            </h2>
            <button
              onClick={getLocation}
              disabled={isLoadingLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                isLoadingLocation
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLoadingLocation ? (
                <>
                  <RotateCw className="animate-spin" size={18} />
                  <span>Obteniendo...</span>
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  <span>Obtener Ubicación</span>
                </>
              )}
            </button>
          </div>

          {location ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Latitud</p>
                  <p className="font-mono text-lg font-bold text-gray-900">
                    {location.lat.toFixed(6)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Longitud</p>
                  <p className="font-mono text-lg font-bold text-gray-900">
                    {location.lng.toFixed(6)}
                  </p>
                </div>
                <div className="col-span-2 bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Precisión</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold">
                      {location.accuracy.toFixed(2)} metros
                    </p>
                    {location.accuracy < 50 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Alta precisión
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Precisión media
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-gray-600">Presiona el botón para obtener tu ubicación actual</p>
              <p className="text-sm text-gray-500 mt-2">
                Se requiere permiso de ubicación para usar el GPS
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="text-green-600" size={24} />
              Captura de Foto
            </h2>
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                disabled={isLoadingCamera || !!photo}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isLoadingCamera || photo
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isLoadingCamera ? "Iniciando..." : "Usar Cámara"}
              </button>
              <button
                onClick={selectFromGallery}
                disabled={!!photo}
                className={`px-4 py-2 rounded-lg font-medium ${
                  photo
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                Galería
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {!photo && (
            <div className="relative bg-black rounded-xl overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={!videoRef.current?.srcObject}
                  className={`px-6 py-3 rounded-full font-bold ${
                    !videoRef.current?.srcObject
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  📸 Capturar Foto
                </button>
              </div>
            </div>
          )}

          {photo && (
            <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-4">
              <img
                src={photo}
                alt="Foto capturada"
                className="w-full h-64 object-contain"
              />
              <button
                onClick={removePhoto}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {photoFile?.name || "foto_capturada.jpg"}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p>💡 <strong>Instrucciones:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Presiona "Usar Cámara" para activar la cámara trasera</li>
              <li>Presiona "Capturar Foto" para tomar la imagen</li>
              <li>O usa "Galería" para seleccionar una foto existente</li>
              <li>La foto se mostrará en preview antes de enviar</li>
            </ul>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="sticky bottom-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !location || !photo}
            className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 ${
              isSubmitting || !location || !photo
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            } transition-all`}
          >
            {isSubmitting ? (
              <>
                <RotateCw className="animate-spin" size={24} />
                <span>Preparando envío...</span>
              </>
            ) : (
              <>
                <Upload size={24} />
                <span>Preparar Envío a API</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            {!location && <p className="text-amber-600">📍 Primero obtén tu ubicación GPS</p>}
            {!photo && <p className="text-amber-600">📸 Luego captura o selecciona una foto</p>}
            {location && photo && (
              <p className="text-green-600">✅ Listo para preparar envío a tu API</p>
            )}
          </div>
        </div>

        {(error || success) && (
          <div className={`mt-6 p-4 rounded-xl ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-start gap-3">
              {error ? (
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
              ) : (
                <CheckCircle className="text-green-600 mt-0.5" size={20} />
              )}
              <div>
                <p className={`font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                  {error || success}
                </p>
                {error && (
                  <p className="text-sm text-red-600 mt-1">
                    Por favor corrige el error e intenta nuevamente.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">🔧 Información para desarrolladores:</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Endpoint API sugerido:</strong> POST /api/visitas/images</p>
            <p><strong>Formato de datos:</strong> FormData con foto y metadatos GPS</p>
            <p><strong>Headers requeridos:</strong> Content-Type: multipart/form-data</p>
            <p><strong>Autenticación:</strong> JWT token en Authorization header</p>
            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
              <p className="font-mono text-xs">
                {`// Ejemplo de fetch a tu API\n`}
                {`const response = await fetch('http://localhost:3001/api/visitas/images', {\n`}
                {`  method: 'POST',\n`}
                {`  headers: {\n`}
                {`    'Authorization': 'Bearer TU_TOKEN_JWT'\n`}
                {`  },\n`}
                {`  body: formData\n`}
                {`});`}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
