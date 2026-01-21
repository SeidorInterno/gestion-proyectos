"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Loader2, Calendar, Flag, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { updateProjectConfig, setProjectBaseline } from "../actions";

interface ConfigDialogProps {
  project: {
    id: string;
    name: string;
    startDate: Date | null;
    baselineEndDate: Date | null;
    status: string;
  };
  projectEndDate: Date;
}

export function ConfigDialog({ project, projectEndDate }: ConfigDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingBaseline, setIsSettingBaseline] = useState(false);

  // Estado del formulario
  const [baselineDate, setBaselineDate] = useState(
    project.baselineEndDate
      ? format(new Date(project.baselineEndDate), "yyyy-MM-dd")
      : format(projectEndDate, "yyyy-MM-dd")
  );

  const hasBaseline = !!project.baselineEndDate;

  const handleSetBaseline = async () => {
    if (!baselineDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha para el baseline",
        variant: "destructive",
      });
      return;
    }

    setIsSettingBaseline(true);
    try {
      await setProjectBaseline(project.id, new Date(baselineDate));
      toast({
        title: "Baseline establecido",
        description: "La fecha baseline del proyecto ha sido guardada",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo establecer el baseline",
        variant: "destructive",
      });
    } finally {
      setIsSettingBaseline(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración del Proyecto</DialogTitle>
          <DialogDescription>
            Ajusta las opciones avanzadas del proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sección: Baseline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Fecha Baseline (Línea Base)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              El baseline es la fecha de fin planificada original. Se usa para comparar el avance real vs. lo planificado.
            </p>

            {hasBaseline ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Baseline actual</p>
                  <p className="text-lg font-bold text-primary">
                    {format(new Date(project.baselineEndDate!), "dd/MM/yyyy")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBaselineDate(format(projectEndDate, "yyyy-MM-dd"))}
                >
                  Actualizar
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Sin baseline definido
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Define un baseline para habilitar el seguimiento de varianza del cronograma
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="baseline">Fecha de fin baseline</Label>
              <div className="flex gap-2">
                <Input
                  id="baseline"
                  type="date"
                  value={baselineDate}
                  onChange={(e) => setBaselineDate(e.target.value)}
                  min={project.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : undefined}
                />
                <Button
                  onClick={handleSetBaseline}
                  disabled={isSettingBaseline}
                >
                  {isSettingBaseline ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fecha de fin calculada actual: {format(projectEndDate, "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Sección: Información del proyecto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Información del Proyecto</h3>
            </div>

            <div className="grid gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de inicio:</span>
                <span className="font-medium">
                  {project.startDate
                    ? format(new Date(project.startDate), "dd/MM/yyyy")
                    : "No definida"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha fin calculada:</span>
                <span className="font-medium">
                  {format(projectEndDate, "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado actual:</span>
                <span className="font-medium">{project.status}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
