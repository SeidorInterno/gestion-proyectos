"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ExportButton() {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        startDate: dateFrom,
        endDate: dateTo,
      });

      const response = await fetch(`/api/timetracking/export?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al exportar");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registro-horas-${dateFrom}-${dateTo}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportacion completada",
        description: "El archivo CSV se descargo correctamente",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "No se pudo exportar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async (period: "week" | "month") => {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (period === "week") {
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1); // Lunes
      end = new Date(today);
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(end.toISOString().split("T")[0]);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Exportar periodo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport("week")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Esta semana
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport("month")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Este mes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Personalizado...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Exportar Registro de Horas</DialogTitle>
            <DialogDescription>
              Selecciona el rango de fechas para exportar a CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
