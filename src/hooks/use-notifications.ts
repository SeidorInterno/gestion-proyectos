import { toast } from "sonner";

type NotificationType = "success" | "error" | "warning" | "info" | "loading";

interface NotifyOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultMessages = {
  created: {
    client: "Cliente creado exitosamente",
    project: "Proyecto creado exitosamente",
    user: "Usuario creado exitosamente",
    holiday: "Feriado agregado exitosamente",
    activity: "Actividad creada exitosamente",
  },
  updated: {
    client: "Cliente actualizado exitosamente",
    project: "Proyecto actualizado exitosamente",
    user: "Usuario actualizado exitosamente",
    holiday: "Feriado actualizado exitosamente",
    activity: "Actividad actualizada exitosamente",
  },
  deleted: {
    client: "Cliente eliminado exitosamente",
    project: "Proyecto eliminado exitosamente",
    user: "Usuario eliminado exitosamente",
    holiday: "Feriado eliminado exitosamente",
    activity: "Actividad eliminada exitosamente",
  },
};

export function useNotifications() {
  const notify = (type: NotificationType, message: string, options?: NotifyOptions) => {
    const config = {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    };

    switch (type) {
      case "success":
        return toast.success(message, config);
      case "error":
        return toast.error(message, config);
      case "warning":
        return toast.warning(message, config);
      case "info":
        return toast.info(message, config);
      case "loading":
        return toast.loading(message, config);
    }
  };

  const success = (message: string, options?: NotifyOptions) =>
    notify("success", message, options);

  const error = (message: string, options?: NotifyOptions) =>
    notify("error", message, options);

  const warning = (message: string, options?: NotifyOptions) =>
    notify("warning", message, options);

  const info = (message: string, options?: NotifyOptions) =>
    notify("info", message, options);

  const loading = (message: string, options?: NotifyOptions) =>
    notify("loading", message, options);

  const dismiss = (toastId?: string | number) => toast.dismiss(toastId);

  // Convenience methods for common CRUD operations
  const created = (entity: keyof typeof defaultMessages.created) =>
    success(defaultMessages.created[entity]);

  const updated = (entity: keyof typeof defaultMessages.updated) =>
    success(defaultMessages.updated[entity]);

  const deleted = (entity: keyof typeof defaultMessages.deleted) =>
    success(defaultMessages.deleted[entity]);

  // Promise-based notification for async operations
  const promise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    created,
    updated,
    deleted,
    promise,
  };
}

// Standalone functions for use outside of hooks
export const showToast = {
  success: (message: string, options?: NotifyOptions) =>
    toast.success(message, options),
  error: (message: string, options?: NotifyOptions) =>
    toast.error(message, options),
  warning: (message: string, options?: NotifyOptions) =>
    toast.warning(message, options),
  info: (message: string, options?: NotifyOptions) =>
    toast.info(message, options),
  loading: (message: string, options?: NotifyOptions) =>
    toast.loading(message, options),
  dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};
