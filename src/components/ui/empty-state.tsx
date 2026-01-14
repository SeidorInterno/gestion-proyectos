"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-4 rounded-full bg-muted p-4"
      >
        <Icon className="h-8 w-8 text-muted-foreground" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-lg font-semibold"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4 max-w-sm text-sm text-muted-foreground"
      >
        {description}
      </motion.p>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick}>{action.label}</Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Specific empty states
export function NoDataFound({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Search}
      title="No se encontraron resultados"
      description="Intenta ajustar los filtros de busqueda o crea un nuevo registro."
      action={onAction ? { label: "Limpiar filtros", onClick: onAction } : undefined}
    />
  );
}

export function NoProjects({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").FolderKanban}
      title="No hay proyectos"
      description="Crea tu primer proyecto para comenzar a gestionar tus actividades RPA."
      action={onAction ? { label: "Crear proyecto", onClick: onAction } : undefined}
    />
  );
}

export function NoClients({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Building2}
      title="No hay clientes"
      description="Registra tu primer cliente para comenzar a crear proyectos."
      action={onAction ? { label: "Agregar cliente", onClick: onAction } : undefined}
    />
  );
}

export function NoUsers({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Users}
      title="No hay usuarios"
      description="Crea usuarios para asignarlos a los proyectos."
      action={onAction ? { label: "Crear usuario", onClick: onAction } : undefined}
    />
  );
}

export function NoActivities() {
  return (
    <EmptyState
      icon={require("lucide-react").ListTodo}
      title="No hay actividades"
      description="Este proyecto aun no tiene actividades configuradas."
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={require("lucide-react").Bell}
      title="Sin notificaciones"
      description="No tienes notificaciones pendientes."
    />
  );
}
