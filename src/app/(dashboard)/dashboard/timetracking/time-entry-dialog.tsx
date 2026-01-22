"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createTimeEntry, updateTimeEntry } from "./actions";

interface Project {
  id: string;
  name: string;
  pep: string;
  phases: {
    activities: {
      id: string;
      code: string;
      name: string;
    }[];
  }[];
}

interface TimeEntryData {
  id: string;
  date: Date;
  hours: number;
  description: string;
  task: string | null;
  projectId: string;
  activityId?: string | null;
}

interface TimeEntryDialogProps {
  children: React.ReactNode;
  projects: Project[];
  entry?: TimeEntryData;
  onSuccess?: () => void;
}

export function TimeEntryDialog({
  children,
  projects,
  entry,
  onSuccess,
}: TimeEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!entry;

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    projectId: "",
    date: today,
    hours: "8",
    task: "",
    description: "",
    activityId: "",
  });

  // Reset form when dialog opens/closes or entry changes
  useEffect(() => {
    if (open && entry) {
      setFormData({
        projectId: entry.projectId,
        date: new Date(entry.date).toISOString().split("T")[0],
        hours: entry.hours.toString(),
        task: entry.task || "",
        description: entry.description,
        activityId: entry.activityId || "",
      });
    } else if (open && !entry) {
      // Pre-seleccionar proyecto si solo hay uno
      const defaultProjectId = projects.length === 1 ? projects[0].id : "";
      setFormData({
        projectId: defaultProjectId,
        date: today,
        hours: "8",
        task: "",
        description: "",
        activityId: "",
      });
    }
  }, [open, entry, projects, today]);

  // Obtener actividades del proyecto seleccionado
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === formData.projectId);
  }, [projects, formData.projectId]);

  const activities = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.phases.flatMap((phase) => phase.activities);
  }, [selectedProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours < 0.5 || hours > 24) {
      toast({
        title: "Error",
        description: "Las horas deben estar entre 0.5 y 24",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validar fecha no futura
    const selectedDate = new Date(formData.date);
    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999);
    if (selectedDate > todayDate) {
      toast({
        title: "Error",
        description: "No podes registrar horas en fechas futuras",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validar fecha muy antigua (más de 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (selectedDate < sevenDaysAgo && !confirm("Estas registrando hace mas de 7 dias. ¿Continuar?")) {
      setIsLoading(false);
      return;
    }

    // Validar más de 12 horas
    if (hours > 12 && !confirm(`Estas registrando mas de 12 horas (${hours}h). ¿Continuar?`)) {
      setIsLoading(false);
      return;
    }

    try {
      const data = {
        projectId: formData.projectId,
        date: new Date(formData.date),
        hours,
        task: formData.task || undefined,
        description: formData.description,
        activityId: formData.activityId && formData.activityId !== "none" ? formData.activityId : undefined,
      };

      if (isEditMode && entry) {
        await updateTimeEntry(entry.id, data);
        toast({
          title: "Registro actualizado",
          description: "Las horas se actualizaron correctamente",
        });
      } else {
        await createTimeEntry(data);
        toast({
          title: "Horas registradas",
          description: `${hours}h registradas en ${selectedProject?.name}`,
        });
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrio un error al guardar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Registro" : "Nueva Entrada de Horas"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica los datos del registro de horas."
              : "Registra las horas trabajadas en un proyecto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project">Proyecto *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value, activityId: "" })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <span>{project.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        ({project.pep})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  max={today}
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hours">Horas *</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task">Tarea (opcional)</Label>
              <Input
                id="task"
                value={formData.task}
                onChange={(e) =>
                  setFormData({ ...formData, task: e.target.value })
                }
                placeholder="Ej: Desarrollo, Testing, Documentacion"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="activity">Actividad del Cronograma (opcional)</Label>
              <Select
                value={formData.activityId}
                onValueChange={(value) =>
                  setFormData({ ...formData, activityId: value })
                }
                disabled={!formData.projectId || activities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.code} - {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincular a una actividad del Gantt (opcional)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripcion *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Contanos brevemente que hiciste"
                maxLength={500}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.projectId || !formData.description}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Guardando..." : "Registrando..."}
                </>
              ) : isEditMode ? (
                "Guardar Cambios"
              ) : (
                "Registrar Horas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
