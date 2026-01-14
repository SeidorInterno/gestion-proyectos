"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Loader2
} from "lucide-react";

type ProjectStatus = "PLANIFICACION" | "EN_PROGRESO" | "PAUSADO" | "COMPLETADO" | "CANCELADO";
type ActivityStatus = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" | "BLOQUEADO";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  animated?: boolean;
}

const projectStatusConfig: Record<ProjectStatus, StatusConfig> = {
  PLANIFICACION: {
    label: "Planificacion",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: Clock,
  },
  EN_PROGRESO: {
    label: "En Progreso",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: Play,
    animated: true,
  },
  PAUSADO: {
    label: "Pausado",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Pause,
  },
  COMPLETADO: {
    label: "Completado",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle,
  },
  CANCELADO: {
    label: "Cancelado",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
  },
};

const activityStatusConfig: Record<ActivityStatus, StatusConfig> = {
  PENDIENTE: {
    label: "Pendiente",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: Timer,
  },
  EN_PROGRESO: {
    label: "En Progreso",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: Loader2,
    animated: true,
  },
  COMPLETADO: {
    label: "Completado",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
  },
  BLOQUEADO: {
    label: "Bloqueado",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
  },
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

interface ActivityStatusBadgeProps {
  status: ActivityStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function ProjectStatusBadge({
  status,
  showIcon = true,
  size = "md",
}: ProjectStatusBadgeProps) {
  const config = projectStatusConfig[status];
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        config.bgColor,
        config.borderColor,
        config.color
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            config.animated && "animate-pulse"
          )}
        />
      )}
      {config.label}
    </motion.span>
  );
}

export function ActivityStatusBadge({
  status,
  showIcon = true,
  size = "md",
}: ActivityStatusBadgeProps) {
  const config = activityStatusConfig[status];
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        config.bgColor,
        config.borderColor,
        config.color
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            config.animated && status === "EN_PROGRESO" && "animate-spin"
          )}
        />
      )}
      {config.label}
    </motion.span>
  );
}

// Progress badge with percentage
interface ProgressBadgeProps {
  progress: number;
  size?: "sm" | "md" | "lg";
}

export function ProgressBadge({ progress, size = "md" }: ProgressBadgeProps) {
  const getColor = () => {
    if (progress === 100) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
    if (progress >= 70) return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" };
    if (progress >= 30) return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" };
    return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" };
  };

  const colors = getColor();

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        colors.bg,
        colors.border,
        colors.text
      )}
    >
      {progress}%
    </motion.span>
  );
}

// Role badge
type UserRole = "MANAGER" | "ARQUITECTO_RPA" | "CONSULTOR";

const roleConfig: Record<UserRole, StatusConfig> = {
  MANAGER: {
    label: "Manager",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: ({ className }) => <span className={className}>M</span>,
  },
  ARQUITECTO_RPA: {
    label: "Arquitecto RPA",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: ({ className }) => <span className={className}>AR</span>,
  },
  CONSULTOR: {
    label: "Consultor",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    icon: ({ className }) => <span className={className}>C</span>,
  },
};

export function RoleBadge({
  role,
  size = "md",
}: {
  role: UserRole;
  size?: "sm" | "md" | "lg";
}) {
  const config = roleConfig[role];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        sizeClasses[size],
        config.bgColor,
        config.borderColor,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
