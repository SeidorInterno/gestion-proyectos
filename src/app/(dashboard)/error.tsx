"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error en la pagina
          </h1>
          <p className="text-gray-600 mb-4">
            Ha ocurrido un error al cargar esta seccion. Por favor, intenta de
            nuevo.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-mono text-gray-700 break-words">
                {error.message}
              </p>
            </div>
          )}
          {error.digest && (
            <p className="text-sm text-gray-500 font-mono">
              Ref: {error.digest}
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
