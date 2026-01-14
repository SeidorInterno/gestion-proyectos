"use client";

import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { updateEvent, deleteEvent } from "./actions";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string | null;
  dueDate?: Date | null;
  assignedToId?: string | null;
}

interface User {
  id: string;
  name: string | null;
}

interface EventEditDialogProps {
  event: Event;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: "BLOCKER", label: "Blocker" },
  { value: "ISSUE", label: "Issue" },
  { value: "RISK", label: "Riesgo" },
  { value: "CHANGE", label: "Cambio" },
  { value: "PAUSE", label: "Pausa" },
  { value: "ABSENCE", label: "Ausencia" },
  { value: "MILESTONE", label: "Hito" },
];

const statuses = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CERRADO", label: "Cerrado" },
];

const priorities = [
  { value: "CRITICO", label: "Critica" },
  { value: "ALTO", label: "Alta" },
  { value: "MEDIO", label: "Media" },
  { value: "BAJO", label: "Baja" },
];

export function EventEditDialog({
  event,
  users,
  open,
  onOpenChange,
}: EventEditDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    category: event.category,
    status: event.status,
    priority: event.priority || "MEDIO",
    assignedToId: event.assignedToId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateEvent(event.id, {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category as "BLOCKER" | "ISSUE" | "RISK" | "CHANGE" | "PAUSE" | "ABSENCE" | "MILESTONE",
        status: formData.status as "ABIERTO" | "EN_PROGRESO" | "RESUELTO" | "CERRADO",
        priority: formData.priority as "CRITICO" | "ALTO" | "MEDIO" | "BAJO" | undefined,
        assignedToId: formData.assignedToId || null,
      });

      toast({
        title: "Evento actualizado",
        description: "Los cambios han sido guardados correctamente",
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      await deleteEvent(event.id);

      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado correctamente",
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Modifica los detalles del evento
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Asignado a</Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assignedToId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El evento sera eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
