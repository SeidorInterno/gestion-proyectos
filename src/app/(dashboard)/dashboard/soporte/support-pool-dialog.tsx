"use client";

import { useState, type ReactNode } from "react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { createSupportPool, updateSupportPool } from "./actions";
import type { SupportPoolStatus } from "@prisma/client";

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

interface SupportPool {
  id: string;
  name: string;
  description: string | null;
  pep: string;
  totalHours: number;
  autoAcceptThreshold: number | null;
  status: SupportPoolStatus;
  clientId: string;
  projectId: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface SupportPoolDialogProps {
  children: ReactNode;
  pool?: SupportPool;
  clients: Client[];
  projects: Project[];
}

const POOL_STATUSES = [
  { value: "ACTIVA", label: "Activa" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "CERRADA", label: "Cerrada" },
  { value: "AGOTADA", label: "Agotada" },
];

export function SupportPoolDialog({
  children,
  pool,
  clients,
  projects,
}: SupportPoolDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: pool?.name || "",
    description: pool?.description || "",
    pep: pool?.pep || "",
    totalHours: pool?.totalHours?.toString() || "",
    autoAcceptThreshold: pool?.autoAcceptThreshold?.toString() || "",
    status: pool?.status || "ACTIVA",
    clientId: pool?.clientId || "",
    projectId: pool?.projectId || "",
    startDate: pool?.startDate || undefined,
    endDate: pool?.endDate || undefined,
  });

  const isEditing = !!pool;

  // Filtrar proyectos por cliente seleccionado
  const filteredProjects = formData.clientId
    ? projects.filter((p) => p.clientId === formData.clientId)
    : projects;

  // Opciones del combobox de clientes
  const clientOptions: ComboboxOption[] = clients.map((client) => ({
    value: client.id,
    label: client.name,
    icon: "🏢",
  }));

  // Opciones del combobox de proyectos
  const projectOptions: ComboboxOption[] = [
    { value: "none", label: "Sin proyecto" },
    ...filteredProjects.map((project) => ({
      value: project.id,
      label: project.name,
      icon: "🤖",
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        pep: formData.pep,
        totalHours: parseFloat(formData.totalHours),
        autoAcceptThreshold: formData.autoAcceptThreshold
          ? parseFloat(formData.autoAcceptThreshold)
          : undefined,
        clientId: formData.clientId,
        projectId: formData.projectId && formData.projectId !== "none" ? formData.projectId : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (isEditing) {
        await updateSupportPool(pool.id, {
          ...data,
          status: formData.status as SupportPoolStatus,
          projectId: formData.projectId || null,
        });
        toast({
          title: "Bolsa actualizada",
          description: "Los cambios han sido guardados correctamente",
        });
      } else {
        await createSupportPool(data);
        toast({
          title: "Bolsa creada",
          description: "La bolsa de soporte ha sido creada correctamente",
        });
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la bolsa de soporte",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({
      ...formData,
      clientId,
      projectId: "", // Limpiar proyecto cuando cambia el cliente
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Bolsa de Soporte" : "Nueva Bolsa de Soporte"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos de la bolsa de soporte"
              : "Completá los datos para crear una nueva bolsa de horas de soporte"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y PEP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Soporte Banco ABC 2025"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pep">Código PEP *</Label>
              <Input
                id="pep"
                placeholder="PE-2025-001"
                value={formData.pep}
                onChange={(e) =>
                  setFormData({ ...formData, pep: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción de la bolsa de soporte..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Cliente y Proyecto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Combobox
                value={formData.clientId}
                onChange={handleClientChange}
                options={clientOptions}
                placeholder="Seleccionar cliente"
                searchPlaceholder="Buscar cliente..."
                emptyText="No se encontraron clientes"
              />
            </div>
            <div className="space-y-2">
              <Label>Proyecto (opcional)</Label>
              <Combobox
                value={formData.projectId}
                onChange={(value) =>
                  setFormData({ ...formData, projectId: value })
                }
                options={projectOptions}
                placeholder="Seleccionar proyecto"
                searchPlaceholder="Buscar proyecto..."
                emptyText="No hay proyectos para este cliente"
                disabled={!formData.clientId}
              />
            </div>
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalHours">Horas Totales *</Label>
              <Input
                id="totalHours"
                type="number"
                min="1"
                step="0.5"
                placeholder="200"
                value={formData.totalHours}
                onChange={(e) =>
                  setFormData({ ...formData, totalHours: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoAcceptThreshold">
                Auto-aceptar hasta (horas)
              </Label>
              <Input
                id="autoAcceptThreshold"
                type="number"
                min="0"
                step="0.5"
                placeholder="2"
                value={formData.autoAcceptThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoAcceptThreshold: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Tickets con estimación menor se auto-aceptan
              </p>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate
                      ? format(formData.startDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, startDate: date });
                      setStartDateOpen(false);
                    }}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate
                      ? format(formData.endDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, endDate: date });
                      setEndDateOpen(false);
                    }}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Estado (solo en edición) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as SupportPoolStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POOL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Bolsa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
