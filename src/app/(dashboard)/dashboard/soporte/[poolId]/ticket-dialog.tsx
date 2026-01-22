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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Loader2, ChevronDown, ChevronUp, Link2, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { createTicket, updateTicket, createFlow } from "./actions";
import { TICKET_TYPES, TICKET_PRIORITIES } from "@/lib/support-utils";
import type { TicketType, TicketPriority, TicketStage } from "@prisma/client";

interface Flow {
  id: string;
  name: string;
}

interface ClientProject {
  id: string;
  name: string;
  clientId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  stage: TicketStage;
  flowId: string | null;
  screenshotUrl: string | null;
  excelUrl: string | null;
  incidentDate: Date | null;
  reporterEmail: string;
  ccEmails: string | null;
  estimatedHours: number | null;
  assignedToId: string | null;
}

interface TicketDialogProps {
  children: ReactNode;
  poolId: string;
  flows: Flow[];
  users: User[];
  ticket?: Ticket;
  clientProjects?: ClientProject[];
}

export function TicketDialog({
  children,
  poolId,
  flows,
  users,
  ticket,
  clientProjects = [],
}: TicketDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [localFlows, setLocalFlows] = useState<Flow[]>(flows);

  const isEditing = !!ticket;

  const [formData, setFormData] = useState({
    title: ticket?.title || "",
    description: ticket?.description || "",
    type: ticket?.type || "INCIDENCIA",
    priority: ticket?.priority || "MEDIA",
    flowId: ticket?.flowId || "",
    screenshotUrl: ticket?.screenshotUrl || "",
    excelUrl: ticket?.excelUrl || "",
    incidentDate: ticket?.incidentDate || undefined,
    reporterEmail: ticket?.reporterEmail || "",
    ccEmails: ticket?.ccEmails ? JSON.parse(ticket.ccEmails).join(", ") : "",
    estimatedHours: ticket?.estimatedHours?.toString() || "",
    assignedToId: ticket?.assignedToId || "",
  });

  // Construir opciones del combobox de procesos
  const processOptions: ComboboxOption[] = [
    { value: "none", label: "Sin especificar" },
    ...clientProjects.map((project) => ({
      value: `project:${project.id}`,
      label: project.name,
      icon: "🤖",
      group: "Proyectos RPA",
    })),
    ...localFlows.map((flow) => ({
      value: `flow:${flow.id}`,
      label: flow.name,
      icon: "📂",
      group: "Procesos Legacy",
    })),
  ];

  // Construir opciones del combobox de usuarios
  const userOptions: ComboboxOption[] = [
    { value: "none", label: "Sin asignar" },
    ...users.map((user) => ({
      value: user.id,
      label: user.name,
      icon: "👤",
    })),
  ];

  const handleCreateLegacyFlow = async (flowName: string) => {
    if (!flowName.trim()) return;

    setIsCreatingFlow(true);
    try {
      const newFlow = await createFlow({
        name: flowName.trim(),
        poolId,
      });

      // Agregar a la lista local
      setLocalFlows((prev) => [...prev, { id: newFlow.id, name: newFlow.name }]);

      // Seleccionar el nuevo flujo automáticamente
      setFormData((prev) => ({ ...prev, flowId: `flow:${newFlow.id}` }));

      toast({
        title: "Proceso registrado",
        description: `"${newFlow.name}" fue agregado correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el proceso",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFlow(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const ccEmailsArray = formData.ccEmails
        .split(",")
        .map((email: string) => email.trim())
        .filter(Boolean);

      // Parsear el valor seleccionado (puede ser project:xxx o flow:xxx)
      let flowId: string | undefined;
      let projectId: string | undefined;

      if (formData.flowId && formData.flowId !== "none") {
        if (formData.flowId.startsWith("project:")) {
          projectId = formData.flowId.replace("project:", "");
        } else if (formData.flowId.startsWith("flow:")) {
          flowId = formData.flowId.replace("flow:", "");
        } else {
          // Valor legacy sin prefijo
          flowId = formData.flowId;
        }
      }

      const data = {
        title: formData.title,
        description: formData.description,
        type: formData.type as TicketType,
        priority: formData.priority as TicketPriority,
        flowId,
        projectId,
        screenshotUrl: formData.screenshotUrl || undefined,
        excelUrl: formData.excelUrl || undefined,
        incidentDate: formData.incidentDate,
        reporterEmail: formData.reporterEmail,
        ccEmails: ccEmailsArray.length > 0 ? ccEmailsArray : undefined,
        estimatedHours: formData.estimatedHours
          ? parseFloat(formData.estimatedHours)
          : undefined,
        assignedToId: formData.assignedToId && formData.assignedToId !== "none" ? formData.assignedToId : undefined,
      };

      if (isEditing) {
        await updateTicket(ticket.id, data);
        toast({
          title: "Ticket actualizado",
          description: "Los cambios han sido guardados",
        });
      } else {
        await createTicket({ ...data, poolId });
        toast({
          title: "Ticket creado",
          description: "El ticket ha sido registrado correctamente",
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
            : "No se pudo guardar el ticket",
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
            {isEditing ? `Editar ${ticket.code}` : "Nuevo Ticket"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del ticket"
              : "Completá los datos para registrar un nuevo ticket de soporte"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info básica */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información del Incidente
            </h4>

            {/* Flujo y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proceso / Automatización</Label>
                <Combobox
                  value={formData.flowId}
                  onChange={(value) => setFormData({ ...formData, flowId: value })}
                  options={processOptions}
                  placeholder="Seleccionar proceso"
                  searchPlaceholder="Buscar proceso..."
                  emptyText="No se encontraron procesos"
                  allowCreate
                  onCreateNew={handleCreateLegacyFlow}
                  createLabel="Registrar proceso legacy"
                  disabled={isCreatingFlow}
                />
                <p className="text-xs text-muted-foreground">
                  Escribí para buscar o registrar un nuevo proceso legacy.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as TicketType })
                  }
                  className="flex gap-3"
                >
                  {Object.entries(TICKET_TYPES).map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`type-${key}`} />
                      <Label
                        htmlFor={`type-${key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {config.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Breve descripción del problema"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Detallá el problema, pasos para reproducirlo, impacto..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            {/* Prioridad y Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as TicketPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_PRIORITIES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              config.color
                            )}
                          />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha del Incidente</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.incidentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.incidentDate
                        ? format(formData.incidentDate, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.incidentDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, incidentDate: date });
                        setCalendarOpen(false);
                      }}
                      locale={es}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Adjuntos (colapsable) */}
          <Collapsible
            open={attachmentsOpen}
            onOpenChange={setAttachmentsOpen}
            className="border rounded-lg"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between p-4"
              >
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Adjuntos (opcional)
                </span>
                {attachmentsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenshotUrl">Screenshot / Correo (URL)</Label>
                <Input
                  id="screenshotUrl"
                  type="url"
                  placeholder="https://sharepoint.com/..."
                  value={formData.screenshotUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, screenshotUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excelUrl">Excel Transacciones (URL)</Label>
                <Input
                  id="excelUrl"
                  type="url"
                  placeholder="https://sharepoint.com/..."
                  value={formData.excelUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, excelUrl: e.target.value })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Contacto (colapsable) */}
          <Collapsible
            open={contactOpen}
            onOpenChange={setContactOpen}
            className="border rounded-lg"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between p-4"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contacto
                </span>
                {contactOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reporterEmail">Email de Respuesta *</Label>
                <Input
                  id="reporterEmail"
                  type="email"
                  placeholder="cliente@empresa.com"
                  value={formData.reporterEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, reporterEmail: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ccEmails">CC (separados por coma)</Label>
                <Input
                  id="ccEmails"
                  placeholder="otro@empresa.com, jefe@empresa.com"
                  value={formData.ccEmails}
                  onChange={(e) =>
                    setFormData({ ...formData, ccEmails: e.target.value })
                  }
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Asignación y Estimación (solo si edita) */}
          {isEditing && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Gestión Interna
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asignado a</Label>
                  <Combobox
                    value={formData.assignedToId}
                    onChange={(value) =>
                      setFormData({ ...formData, assignedToId: value })
                    }
                    options={userOptions}
                    placeholder="Sin asignar"
                    searchPlaceholder="Buscar usuario..."
                    emptyText="No se encontraron usuarios"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="2.5"
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedHours: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
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
                "Crear Ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
