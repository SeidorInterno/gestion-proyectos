import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <FileQuestion className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Pagina no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La pagina que buscas no existe o ha sido movida a otra ubicacion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atras
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
