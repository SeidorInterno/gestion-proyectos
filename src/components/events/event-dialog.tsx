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
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  createEvent,
  updateEvent,
} from "@/app/(dashboard)/dashboard/proyectos/event-actions";
import {
  categoryConfig,
  priorityConfig,
  eventTypes,
} from "./event-badge";
import { EventCategory, Priority } from "@prisma/client";

interface EventDialogProps {
  projectId: string;
  currentUserId: string;
  activities?: Array<{ id: string; code: string; name: string }>;
  users?: Array<{ id: string; name: string }>;
  children: React.ReactNode;
  editEvent?: {
    id: string;
    category: string;
    type: string;
    title: string;
    description: string | null;
    priority: string | null;
    dueDate: Date | null;
    impactDays: number | null;
    impactCost: number | null;
    assignedToId?: string | null;
    activityId?: string | null;
  };
  onClose?: () => void;
}

export function EventDialog({
  projectId,
  currentUserId,
  activities = [],
  users = [],
  children,
  editEvent,
  onClose,
}: EventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [category, setCategory] = useState<EventCategory>("BLOCKER");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [impactDays, setImpactDays] = useState("");
  const [impactCost, setImpactCost] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [activityId, setActivityId] = useState("");

  // Cargar datos cuando se edita
  useEffect(() => {
    if (editEvent) {
      setCategory(editEvent.category as EventCategory);
      setType(editEvent.type);
      setTitle(editEvent.title);
      setDescription(editEvent.description || "");
      setPriority((editEvent.priority as Priority) || "");
      setImpactDays(editEvent.impactDays?.toString() || "");
      setImpactCost(editEvent.impactCost?.toString() || "");
      setAssignedToId(editEvent.assignedToId || "");
      setActivityId(editEvent.activityId || "");
      setOpen(true);
    }
  }, [editEvent]);

  // Reset form cuando cambia categoría
  useEffect(() => {
    if (!editEvent) {
      setType("");
    }
  }, [category, editEvent]);

  const resetForm = () => {
    setCategory("BLOCKER");
    setType("");
    setTitle("");
    setDescription("");
    setPriority("");
    setImpactDays("");
    setImpactCost("");
    setAssignedToId("");
    setActivityId("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "El titulo es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!type) {
      toast({
        title: "Error",
        description: "El tipo es requerido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editEvent) {
        // Actualizar evento existente
        const result = await updateEvent(editEvent.id, {
          title,
          description: description || undefined,
          priority: priority ? (priority as Priority) : undefined,
          impactDays: impactDays ? parseInt(impactDays) : undefined,
          impactCost: impactCost ? parseFloat(impactCost) : undefined,
          assignedToId: assignedToId || undefined,
          activityId: activityId || undefined,
        });

        if (result.success) {
          toast({
            title: "Evento actualizado",
            description: "El evento ha sido actualizado correctamente",
          });
          setOpen(false);
          resetForm();
          onClose?.();
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Crear nuevo evento
        const result = await createEvent({
          projectId,
          category,
          type,
          title,
          description: description || undefined,
          priority: priority ? (priority as Priority) : undefined,
          impactDays: impactDays ? parseInt(impactDays) : undefined,
          impactCost: impactCost ? parseFloat(impactCost) : undefined,
          assignedToId: assignedToId || undefined,
          reportedById: currentUserId,
          activityId: activityId || undefined,
        });

        if (result.success) {
          toast({
            title: "Evento creado",
            description:
              category === "BLOCKER" && priority === "CRITICO"
                ? "Blocker critico creado. El proyecto ha sido pausado automaticamente."
                : "El evento ha sido creado correctamente",
          });
          setOpen(false);
          resetForm();
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      onClose?.();
    }
  };

  const currentTypes = eventTypes[category] || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editEvent ? "Editar Evento" : "Nuevo Evento"}
          </DialogTitle>
          <DialogDescription>
            {editEvent
              ? "Modifica los detalles del evento"
              : "Registra un nuevo evento en el proyecto"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Categoría (solo para crear) */}
          {!editEvent && (
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EventCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo */}
          {!editEvent && (
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {currentTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Título */}
          <div className="grid gap-2">
            <Label>Titulo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descripcion breve del evento"
            />
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <Label>Descripcion (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          {/* Prioridad */}
          <div className="grid gap-2">
            <Label>Prioridad</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Impacto en días y costo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Impacto (dias)</Label>
              <Input
                type="number"
                value={impactDays}
                onChange={(e) => setImpactDays(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Impacto (costo)</Label>
              <Input
                type="number"
                value={impactCost}
                onChange={(e) => setImpactCost(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Asignado a */}
          {users.length > 0 && (
            <div className="grid gap-2">
              <Label>Asignado a (opcional)</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actividad afectada */}
          {activities.length > 0 && (
            <div className="grid gap-2">
              <Label>Actividad afectada (opcional)</Label>
              <Select value={activityId} onValueChange={setActivityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.code} - {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editEvent ? "Actualizando..." : "Creando..."}
              </>
            ) : editEvent ? (
              "Actualizar"
            ) : (
              "Crear Evento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
