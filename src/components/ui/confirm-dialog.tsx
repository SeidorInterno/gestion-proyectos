"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "destructive" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => Promise<void> | void;
  children?: React.ReactNode;
}

const variantConfig = {
  destructive: {
    icon: Trash2,
    iconClassName: "text-red-500",
    buttonClassName: "bg-red-600 hover:bg-red-700 focus:ring-red-600",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-yellow-500",
    buttonClassName: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600",
  },
  info: {
    icon: Info,
    iconClassName: "text-blue-500",
    buttonClassName: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600",
  },
  success: {
    icon: CheckCircle,
    iconClassName: "text-green-500",
    buttonClassName: "bg-green-600 hover:bg-green-700 focus:ring-green-600",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "destructive",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const config = variantConfig[variant];
  const Icon = isSuccess ? CheckCircle : config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      // Show success state briefly before closing
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 800);
    } catch (error) {
      console.error("Error in confirm action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                isSuccess && "bg-green-100",
                !isSuccess && variant === "destructive" && "bg-red-100",
                !isSuccess && variant === "warning" && "bg-yellow-100",
                !isSuccess && variant === "info" && "bg-blue-100",
                !isSuccess && variant === "success" && "bg-green-100"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors", isSuccess ? "text-green-500" : config.iconClassName)} />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle>{isSuccess ? "Completado" : title}</AlertDialogTitle>
              <AlertDialogDescription>
                {isSuccess ? "La accion se ha completado exitosamente." : description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        {children && !isSuccess && <div className="py-4">{children}</div>}
        {!isSuccess && (
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isLoading}
              className={cn(config.buttonClassName)}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2 text-white" />
                  Procesando...
                </>
              ) : (
                confirmLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier dialog management
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: DialogVariant;
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "destructive",
    onConfirm: () => {},
  });

  const confirm = (options: {
    title: string;
    description: string;
    variant?: DialogVariant;
    onConfirm: () => Promise<void> | void;
  }) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      variant: options.variant || "destructive",
      onConfirm: options.onConfirm,
    });
  };

  const close = () => setState((prev) => ({ ...prev, open: false }));

  return {
    confirm,
    close,
    dialogProps: {
      open: state.open,
      onOpenChange: (open: boolean) => setState((prev) => ({ ...prev, open })),
      title: state.title,
      description: state.description,
      variant: state.variant,
      onConfirm: state.onConfirm,
    },
  };
}

// Specific delete confirmation
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  entityName,
  entityType,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  entityType: string;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Eliminar ${entityType}`}
      description={`¿Estas seguro de que deseas eliminar "${entityName}"? Esta accion no se puede deshacer.`}
      confirmLabel="Eliminar"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}
