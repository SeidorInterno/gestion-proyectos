"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Algo salio mal
          </h1>
          <p className="text-gray-600 mb-4">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo o
            contacta al administrador si el problema persiste.
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 font-mono">
              Codigo de error: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir al Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
