"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Download, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { importPeruHolidays } from "../calendario/actions";

export function HolidayImporter() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedYears, setImportedYears] = useState<number[]>([]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const handleImport = async () => {
    if (!selectedYear) {
      toast({
        title: "Selecciona un año",
        description: "Debes seleccionar un año para importar los feriados",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      await importPeruHolidays(parseInt(selectedYear));
      setImportedYears([...importedYears, parseInt(selectedYear)]);
      toast({
        title: "Feriados importados",
        description: `Los feriados de Peru para ${selectedYear} se han importado correctamente`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron importar los feriados. Verifica tus permisos.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Año a importar</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona un año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                  {importedYears.includes(year) && (
                    <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleImport} disabled={isImporting || !selectedYear}>
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Importar Feriados
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border p-4 bg-muted/50">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Feriados oficiales de Peru
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 1 de Enero - Año Nuevo</li>
          <li>• Jueves y Viernes Santo (variable)</li>
          <li>• 1 de Mayo - Dia del Trabajo</li>
          <li>• 29 de Junio - San Pedro y San Pablo</li>
          <li>• 28 y 29 de Julio - Fiestas Patrias</li>
          <li>• 30 de Agosto - Santa Rosa de Lima</li>
          <li>• 8 de Octubre - Combate de Angamos</li>
          <li>• 1 de Noviembre - Todos los Santos</li>
          <li>• 8 de Diciembre - Inmaculada Concepcion</li>
          <li>• 9 de Diciembre - Batalla de Ayacucho</li>
          <li>• 25 de Diciembre - Navidad</li>
        </ul>
      </div>
    </div>
  );
}
