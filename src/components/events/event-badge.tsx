"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Pause,
  FileEdit,
  Bug,
  UserX,
  Flag,
} from "lucide-react";

// Labels y configuración por categoría
export const categoryConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  BLOCKER: {
    label: "Blocker",
    icon: AlertTriangle,
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
  },
  RISK: {
    label: "Riesgo",
    icon: AlertCircle,
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  PAUSE: {
    label: "Pausa",
    icon: Pause,
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  CHANGE: {
    label: "Cambio",
    icon: FileEdit,
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  ISSUE: {
    label: "Issue",
    icon: Bug,
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  ABSENCE: {
    label: "Ausencia",
    icon: UserX,
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
  MILESTONE: {
    label: "Hito",
    icon: Flag,
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

// Labels por prioridad
export const priorityConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  CRITICO: { label: "Critico", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-950" },
  ALTO: { label: "Alto", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-950" },
  MEDIO: { label: "Medio", color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-950" },
  BAJO: { label: "Bajo", color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" },
};

// Labels por estado
export const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ABIERTO: { label: "Abierto", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-950" },
  EN_PROGRESO: {
    label: "En Progreso",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
  },
  RESUELTO: {
    label: "Resuelto",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
  },
  CERRADO: { label: "Cerrado", color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" },
};

// Tipos de evento por categoría
export const eventTypes: Record<string, { value: string; label: string }[]> = {
  BLOCKER: [
    { value: "TECNICO", label: "Tecnico" },
    { value: "DEPENDENCIA", label: "Dependencia" },
    { value: "RECURSO", label: "Recurso" },
    { value: "CLIENTE", label: "Cliente" },
    { value: "ACCESO", label: "Acceso" },
    { value: "DATOS", label: "Datos" },
    { value: "PRESUPUESTO", label: "Presupuesto" },
    { value: "LEGAL", label: "Legal" },
  ],
  RISK: [
    { value: "IDENTIFICADO", label: "Identificado" },
    { value: "EN_MONITOREO", label: "En Monitoreo" },
    { value: "MITIGADO", label: "Mitigado" },
  ],
  PAUSE: [
    { value: "CLIENTE", label: "Solicitud Cliente" },
    { value: "INTERNO", label: "Decision Interna" },
    { value: "REPRIORIZACION", label: "Repriorizacion" },
    { value: "VACACIONES", label: "Vacaciones" },
    { value: "PRESUPUESTO", label: "Presupuesto" },
  ],
  CHANGE: [
    { value: "AMPLIACION", label: "Ampliacion" },
    { value: "REDUCCION", label: "Reduccion" },
    { value: "MODIFICACION", label: "Modificacion" },
  ],
  ISSUE: [
    { value: "BUG", label: "Bug" },
    { value: "AMBIENTE", label: "Ambiente" },
    { value: "PERFORMANCE", label: "Performance" },
    { value: "INTEGRACION", label: "Integracion" },
  ],
  ABSENCE: [
    { value: "VACACIONES", label: "Vacaciones" },
    { value: "ENFERMEDAD", label: "Enfermedad" },
    { value: "CAPACITACION", label: "Capacitacion" },
    { value: "OTRO_PROYECTO", label: "Otro Proyecto" },
  ],
  MILESTONE: [
    { value: "KICKOFF", label: "Kickoff" },
    { value: "ENTREGA", label: "Entrega" },
    { value: "UAT", label: "UAT" },
    { value: "GO_LIVE", label: "Go Live" },
    { value: "CIERRE", label: "Cierre" },
  ],
};

interface EventCategoryBadgeProps {
  category: string;
  showIcon?: boolean;
  className?: string;
}

export function EventCategoryBadge({
  category,
  showIcon = true,
  className,
}: EventCategoryBadgeProps) {
  const config = categoryConfig[category];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </div>
  );
}

interface EventPriorityBadgeProps {
  priority: string | null;
  className?: string;
}

export function EventPriorityBadge({
  priority,
  className,
}: EventPriorityBadgeProps) {
  if (!priority) return null;

  const config = priorityConfig[priority];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn(config.bgColor, config.color, "border-0", className)}
    >
      {config.label}
    </Badge>
  );
}

interface EventStatusBadgeProps {
  status: string;
  className?: string;
}

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn(config.bgColor, config.color, "border-0", className)}
    >
      {config.label}
    </Badge>
  );
}
