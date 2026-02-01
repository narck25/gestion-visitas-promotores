"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Camera, MapPin, Upload, X, Check, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, Loader2, Home, RotateCcw
} from "lucide-react";

// Tipos
type Step = 1 | 2 | 3 | 4 | 5;

interface VisitData {
  cliente: string;
  notas: string;
  location: { lat: number; lng: number; accuracy: number } | null;
  fotoAntes: { file: File; url: string } | null;
  fotoDespues: { file: File; url: string } | null;
}

export default function NuevaVisitaPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [visitData, setVisitData] = useState<VisitData>({
    cliente: "",
    notas: "",
    location: null,
    fotoAntes: null,
    fotoDespues: null,
  });

  // Estados para manejo de UI
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Función para obtener ubicación GPS
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización");
      return;
    }

    setIsLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitData({
          ...visitData,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        let errorMessage = "No se pudo obtener la ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Por favor habilita el GPS en tu dispositivo";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible. Intenta de nuevo";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo agotado. Intenta de nuevo";
            break;
        }
        setError(errorMessage);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-obtener ubicación al llegar al paso 2
  useEffect(() => {
    if (currentStep === 2 && !visitData.location && !isLoadingLocation) {
      getLocation();
    }
  }, [currentStep]);

  // Función para iniciar cámara
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Tu dispositivo no soporta acceso a la cámara");
      return;
    }

    setIsLoadingCamera(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err) {
      setError("No se pudo acceder a la cámara. Asegúrate de permitir el acceso");
      setIsLoadingCamera(false);
    }
  };

  // Función para detener cámara
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Función para capturar foto
  const capturePhoto = (tipo: "antes" | "despues") => {
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
        const file = new File([blob], `foto_${tipo}_${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        const url = URL.createObjectURL(blob);

        if (tipo === "antes") {
          setVisitData({ ...visitData, fotoAntes: { file, url } });
        } else {
          setVisitData({ ...visitData, fotoDespues: { file, url } });
        }

        stopCamera();
      }
    }, "image/jpeg", 0.9);
  };

  // Función para retomar foto
  const retakePhoto = (tipo: "antes" | "despues") => {
    if (tipo === "antes") {
      if (visitData.fotoAntes) URL.revokeObjectURL(visitData.fotoAntes.url);
      setVisitData({ ...visitData, fotoAntes: null });
    } else {
      if (visitData.fotoDespues) URL.revokeObjectURL(visitData.fotoDespues.url);
      setVisitData({ ...visitData, fotoDespues: null });
    }
    startCamera();
  };

  // Validar si se puede avanzar al siguiente paso
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return visitData.cliente.trim() !== "";
      case 2:
        return visitData.location !== null;
      case 3:
        return visitData.fotoAntes !== null;
      case 4:
        return visitData.fotoDespues !== null;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Navegar entre pasos
  const goToStep = (step: Step) => {
    setError(null);
    stopCamera();
    setCurrentStep(step);
  };

  // Enviar visita a la API
  const handleSubmit = async () => {
    setIsSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("cliente", visitData.cliente);
      formData.append("notas", visitData.notas);
      formData.append("latitude", visitData.location!.lat.toString());
      formData.append("longitude", visitData.location!.lng.toString());
      formData.append("accuracy", visitData.location!.accuracy.toString());
      formData.append("fotoAntes", visitData.fotoAntes!.file);
      formData.append("fotoDespues", visitData.fotoDespues!.file);
      formData.append("timestamp", new Date().toISOString());

      // Simular envío a API (reemplazar con tu endpoint real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Datos enviados:", {
        cliente: visitData.cliente,
        notas: visitData.notas,
        location: visitData.location,
        fotoAntes: visitData.fotoAntes?.file.name,
        fotoDespues: visitData.fotoDespues?.file.name,
      });

      // Aquí iría el fetch real:
      // const response = await fetch('/api/visitas', {
      //   method: 'POST',
      //   headers: { 'Authorization': 'Bearer TOKEN' },
      //   body: formData
      // });

      setSuccess(true);
      setIsSending(false);
    } catch (err) {
      console.error("Error al enviar visita:", err);
      setError("Error al enviar la visita. Por favor intenta de nuevo.");
      setIsSending(false);
    }
  };

  // Limpiar recursos
  useEffect(() => {
    return () => {
      stopCamera();
      if (visitData.fotoAntes) URL.revokeObjectURL(visitData.fotoAntes.url);
      if (visitData.fotoDespues) URL.revokeObjectURL(visitData.fotoDespues.url);
    };
  }, []);

  // Renderizar pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              ¡Visita Registrada!
            </h1>
            <p className="text-gray-600 mb-8">
              La visita se ha enviado exitosamente al servidor.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
              >
                Registrar Nueva Visita
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Nueva Visita</h1>
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step < currentStep
                      ? "bg-green-600 text-white"
                      : step === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-8 h-1 ${
                      step < currentStep ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-center text-gray-600">
            Paso {currentStep} de 5
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Paso 1: Datos Básicos */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Datos de la Visita
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente / Tienda *
                </label>
                <input
                  type="text"
                  value={visitData.cliente}
                  onChange={(e) =>
                    setVisitData({ ...visitData, cliente: e.target.value })
                  }
                  placeholder="Ingresa el nombre del cliente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={visitData.notas}
                  onChange={(e) =>
                    setVisitData({ ...visitData, notas: e.target.value })
                  }
                  placeholder="Agrega notas adicionales sobre la visita"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Ubicación GPS */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="text-blue-600" size={28} />
              Ubicación GPS
            </h2>
            {isLoadingLocation ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                <p className="text-gray-600">Obteniendo tu ubicación...</p>
              </div>
            ) : visitData.location ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600" size={48} />
                </div>
                <h3 className="text-center font-bold text-gray-900 mb-4">
                  Ubicación Obtenida
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Latitud</p>
                    <p className="font-mono font-bold text-gray-900">
                      {visitData.location.lat.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Longitud</p>
                    <p className="font-mono font-bold text-gray-900">
                      {visitData.location.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="col-span-2 bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Precisión</p>
                    <p className="font-mono font-bold text-gray-900">
                      {visitData.location.accuracy.toFixed(2)} metros
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-gray-600 mb-6">
                  No se pudo obtener la ubicación
                </p>
                <button
                  onClick={getLocation}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <RotateCcw size={20} />
                  Intentar de Nuevo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Foto ANTES */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Camera className="text-green-600" size={28} />
              Foto ANTES
            </h2>
            <p className="text-gray-600 mb-6">
              Toma una foto del estado inicial antes de realizar la visita
            </p>

            {!visitData.fotoAntes && !videoRef.current?.srcObject ? (
              <div className="text-center py-12">
                <Camera className="mx-auto mb-4 text-gray-300" size={64} />
                <button
                  onClick={startCamera}
                  disabled={isLoadingCamera}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 inline-flex items-center gap-2"
                >
                  {isLoadingCamera ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  {isLoadingCamera ? "Iniciando Cámara..." : "Activar Cámara"}
                </button>
              </div>
            ) : !visitData.fotoAntes ? (
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={() => stopCamera()}
                    className="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => capturePhoto("antes")}
                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100"
                  >
                    📸 Capturar
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={visitData.fotoAntes.url}
                  alt="Foto Antes"
                  className="w-full h-80 object-contain"
                />
                <button
                  onClick={() => retakePhoto("antes")}
                  className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  Retomar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 4: Foto DESPUÉS */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Camera className="text-purple-600" size={28} />
              Foto DESPUÉS
            </h2>
            <p className="text-gray-600 mb-6">
              Toma una foto del resultado después de realizar la visita
            </p>

            {!visitData.fotoDespues && !videoRef.current?.srcObject ? (
              <div className="text-center py-12">
                <Camera className="mx-auto mb-4 text-gray-300" size={64} />
                <button
                  onClick={startCamera}
                  disabled={isLoadingCamera}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 inline-flex items-center gap-2"
                >
                  {isLoadingCamera ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  {isLoadingCamera ? "Iniciando Cámara..." : "Activar Cámara"}
                </button>
              </div>
            ) : !visitData.fotoDespues ? (
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={() => stopCamera()}
                    className="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => capturePhoto("despues")}
                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100"
                  >
                    📸 Capturar
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={visitData.fotoDespues.url}
                  alt="Foto Después"
                  className="w-full h-80 object-contain"
                />
                <button
                  onClick={() => retakePhoto("despues")}
                  className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  Retomar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 5: Resumen */}
        {currentStep === 5 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Resumen de la Visita
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Cliente</h3>
                <p className="text-lg font-bold text-gray-900">{visitData.cliente}</p>
              </div>

              {visitData.notas && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Notas</h3>
                  <p className="text-gray-900">{visitData.notas}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Ubicación GPS</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono text-gray-900">
                    {visitData.location?.lat.toFixed(6)}, {visitData.location?.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Foto ANTES</h3>
                  <img
                    src={visitData.fotoAntes?.url}
                    alt="Foto Antes"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Foto DESPUÉS</h3>
                  <img
                    src={visitData.fotoDespues?.url}
                    alt="Foto Después"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={() => goToStep((currentStep - 1) as Step)}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              onClick={() => goToStep((currentStep + 1) as Step)}
              disabled={!canGoNext()}
              className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                canGoNext()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSending}
              className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                isSending
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Enviar Visita
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
