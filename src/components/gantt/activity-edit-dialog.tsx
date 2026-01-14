"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateActivityProgress } from "@/app/(dashboard)/dashboard/proyectos/actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  progress: number;
  participationType: string;
}

interface ActivityEditDialogProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: "PENDIENTE", label: "Pendiente", color: "bg-gray-400" },
  { value: "EN_PROGRESO", label: "En Progreso", color: "bg-blue-500" },
  { value: "COMPLETADO", label: "Completado", color: "bg-green-500" },
  { value: "BLOQUEADO", label: "Bloqueado", color: "bg-red-500" },
];

export function ActivityEditDialog({
  activity,
  open,
  onOpenChange,
}: ActivityEditDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("PENDIENTE");

  // Sync state when activity changes or dialog opens
  useEffect(() => {
    if (activity && open) {
      setProgress(activity.progress);
      setStatus(activity.status);
    }
  }, [activity?.id, open]);

  // Handler para cambio de progreso
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);

    // Auto-ajustar estado segun progreso
    if (newProgress === 100) {
      setStatus("COMPLETADO");
    } else if (newProgress > 0 && status === "COMPLETADO") {
      setStatus("EN_PROGRESO");
    } else if (newProgress > 0 && status === "PENDIENTE") {
      setStatus("EN_PROGRESO");
    } else if (newProgress === 0 && status !== "BLOQUEADO") {
      setStatus("PENDIENTE");
    }
  };

  // Handler para cambio de estado
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);

    // Auto-ajustar progreso segun estado
    if (newStatus === "COMPLETADO") {
      setProgress(100);
    } else if (newStatus === "PENDIENTE" && progress === 100) {
      setProgress(0);
    }
  };

  const handleSave = async () => {
    if (!activity) return;

    setIsLoading(true);
    try {
      await updateActivityProgress(activity.id, progress, status);

      toast({
        title: "Actividad actualizada",
        description: `Progreso: ${progress}% - Estado: ${statusOptions.find(s => s.value === status)?.label}`,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al actualizar la actividad",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Actividad</DialogTitle>
          <DialogDescription>
            Actualiza el progreso y estado de la actividad.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Info de la actividad */}
          <div className="bg-muted/50 border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activity.code}
              </Badge>
              <span className="font-medium text-sm text-foreground">{activity.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {activity.startDate && format(new Date(activity.startDate), "dd/MM/yyyy", { locale: es })}
                {" - "}
                {activity.endDate && format(new Date(activity.endDate), "dd/MM/yyyy", { locale: es })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activity.durationDays} dias
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Progreso</Label>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Estado */}
          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
