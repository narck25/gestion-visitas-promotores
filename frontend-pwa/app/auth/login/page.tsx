"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la página principal si ya está autenticado
    if (isAuthenticated()) {
      router.push("/");
    } else {
      // Redirigir a la página principal donde está el formulario de login
      router.push("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-blue-600 text-2xl">⏳</span>
        </div>
        <p className="text-gray-600">Redirigiendo al inicio...</p>
      </div>
    </div>
  );
}