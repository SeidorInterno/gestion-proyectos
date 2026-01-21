"use client";

import { useState, useEffect, useMemo } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Loader2, Calendar, Clock } from "lucide-react";
import { createProject, updateProject } from "./actions";
import { getDefaultPhaseDurations, type PhaseDurations } from "@/lib/project-template";
import { calculateProjectEndDate, formatDateSpanish } from "@/lib/date-utils";

interface Client {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  managerId?: string | null;
  tool: string;
  startDate?: Date | string | null;
  status?: string;
}

interface ProjectDialogProps {
  children: React.ReactNode;
  project?: Project;
  onSuccess?: () => void;
}

const toolOptions = [
  { value: "UIPATH", label: "UiPath" },
  { value: "POWER_AUTOMATE", label: "Power Automate" },
  { value: "POWER_APPS", label: "Power Apps" },
  { value: "AUTOMATION_ANYWHERE", label: "Automation Anywhere" },
  { value: "BLUE_PRISM", label: "Blue Prism" },
  { value: "OTRO", label: "Otro" },
];

const statusOptions = [
  { value: "PLANIFICACION", label: "Planificacion" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "CANCELADO", label: "Cancelado" },
];

// Obtener duraciones por defecto
const defaultDurations = getDefaultPhaseDurations();

export function ProjectDialog({ children, project, onSuccess }: ProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const isEditMode = !!project;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    managerId: "",
    tool: "UIPATH",
    startDate: "",
    status: "PLANIFICACION",
  });

  const [phaseDurations, setPhaseDurations] = useState<PhaseDurations>({
    prepare: defaultDurations.prepare,
    connect: defaultDurations.connect,
    realize: defaultDurations.realize,
    run: defaultDurations.run,
  });

  // Calcular duración total (sin Prepare, que es anterior)
  const projectDuration = useMemo(() => {
    return phaseDurations.connect + phaseDurations.realize + phaseDurations.run;
  }, [phaseDurations]);

  const totalDuration = useMemo(() => {
    return phaseDurations.prepare + phaseDurations.connect + phaseDurations.realize + phaseDurations.run;
  }, [phaseDurations]);

  // Fecha estimada de fin (solo Connect + Realize + Run, Prepare es antes del inicio)
  const estimatedEndDate = useMemo(() => {
    if (!formData.startDate || projectDuration === 0) return null;
    const startDate = new Date(formData.startDate);
    return calculateProjectEndDate(startDate, projectDuration);
  }, [formData.startDate, projectDuration]);

  // Fecha estimada de inicio de Prepare (hacia atrás desde la fecha de inicio)
  const prepareStartDate = useMemo(() => {
    if (!formData.startDate || phaseDurations.prepare === 0) return null;
    const startDate = new Date(formData.startDate);
    // Restar los días de prepare + 1 (porque empieza el día anterior)
    const prepareStart = new Date(startDate);
    // Cálculo simple: restar días (la versión exacta considera días laborales)
    prepareStart.setDate(prepareStart.getDate() - phaseDurations.prepare - 1);
    return prepareStart;
  }, [formData.startDate, phaseDurations.prepare]);

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open && project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        clientId: project.clientId || "",
        managerId: project.managerId || "",
        tool: project.tool || "UIPATH",
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        status: project.status || "PLANIFICACION",
      });
    } else if (open && !project) {
      setFormData({
        name: "",
        description: "",
        clientId: "",
        managerId: "",
        tool: "UIPATH",
        startDate: "",
        status: "PLANIFICACION",
      });
      // Reset phase durations to defaults
      setPhaseDurations({
        prepare: defaultDurations.prepare,
        connect: defaultDurations.connect,
        realize: defaultDurations.realize,
        run: defaultDurations.run,
      });
    }
  }, [open, project]);

  useEffect(() => {
    if (open) {
      // Cargar clientes y usuarios
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => setClients(data))
        .catch(console.error);

      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(console.error);
    }
  }, [open]);

  const handlePhaseDurationChange = (phase: keyof PhaseDurations, value: string) => {
    const numValue = parseInt(value) || 0;
    setPhaseDurations(prev => ({
      ...prev,
      [phase]: Math.max(0, numValue),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode) {
        await updateProject(project.id, {
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          managerId: formData.managerId || undefined,
        });

        toast({
          title: "Proyecto actualizado",
          description: "Los cambios se han guardado correctamente",
        });
        setOpen(false);
        onSuccess?.();
        router.refresh();
      } else {
        const newProject = await createProject({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          phaseDurations,
        });

        toast({
          title: "Proyecto creado",
          description: "El proyecto y su estructura SAM se han creado correctamente",
        });
        setOpen(false);
        router.push(`/dashboard/proyectos/${newProject.id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode
          ? "Ocurrio un error al actualizar el proyecto"
          : "Ocurrio un error al crear el proyecto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifica los datos del proyecto."
              : "Crea un nuevo proyecto RPA. Configura la duracion de cada fase SAM."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Proyecto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Automatizacion de Facturas"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripcion</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Breve descripcion del proyecto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                  disabled={isEditMode}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manager">Project Manager</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, managerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.id)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tool">Herramienta RPA *</Label>
                <Select
                  value={formData.tool}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tool: value })
                  }
                  disabled={isEditMode}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar herramienta" />
                  </SelectTrigger>
                  <SelectContent>
                    {toolOptions.map((tool) => (
                      <SelectItem key={tool.value} value={tool.value}>
                        {tool.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEditMode ? (
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Fecha de Inicio (Kickoff)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min="2020-01-01"
                    max="2099-12-31"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* Duraciones de Fases SAM - Solo en modo creación */}
            {!isEditMode && (
              <>
                <div className="border-t pt-4 mt-2">
                  <Label className="text-base font-semibold">
                    Duracion de Fases SAM (dias laborales)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configura la duracion de cada fase del proyecto
                  </p>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="prepare" className="text-xs text-center text-orange-600">
                        Prepare (Anterior)
                      </Label>
                      <Input
                        id="prepare"
                        type="number"
                        min="1"
                        value={phaseDurations.prepare}
                        onChange={(e) => handlePhaseDurationChange("prepare", e.target.value)}
                        className="text-center border-orange-200"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="connect" className="text-xs text-center">
                        Connect
                      </Label>
                      <Input
                        id="connect"
                        type="number"
                        min="1"
                        value={phaseDurations.connect}
                        onChange={(e) => handlePhaseDurationChange("connect", e.target.value)}
                        className="text-center"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="realize" className="text-xs text-center">
                        Realize
                      </Label>
                      <Input
                        id="realize"
                        type="number"
                        min="1"
                        value={phaseDurations.realize}
                        onChange={(e) => handlePhaseDurationChange("realize", e.target.value)}
                        className="text-center"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="run" className="text-xs text-center">
                        Run
                      </Label>
                      <Input
                        id="run"
                        type="number"
                        min="1"
                        value={phaseDurations.run}
                        onChange={(e) => handlePhaseDurationChange("run", e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Prepare se calcula hacia atras desde la fecha de inicio
                  </p>
                </div>

                {/* Resumen de duración y fecha estimada */}
                <div className="bg-muted/50 border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duracion total:</span>
                    </div>
                    <span className="font-semibold text-foreground">{totalDuration} dias laborales</span>
                  </div>
                  {prepareStartDate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-muted-foreground">Inicio Prepare (aprox):</span>
                      </div>
                      <span className="font-semibold text-orange-500">
                        {formatDateSpanish(prepareStartDate)}
                      </span>
                    </div>
                  )}
                  {estimatedEndDate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Fecha estimada de fin:</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatDateSpanish(estimatedEndDate)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.clientId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Guardando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Guardar Cambios" : "Crear Proyecto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
