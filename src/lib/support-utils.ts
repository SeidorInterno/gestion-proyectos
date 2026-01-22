import { prisma } from "@/lib/prisma";

/**
 * Genera un código único para un ticket
 * Formato: TKT-YYYY-NNNN (ej: TKT-2025-0042)
 */
export async function generateTicketCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  // Buscar el último ticket del año
  const lastTicket = await prisma.supportTicket.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: "desc",
    },
    select: {
      code: true,
    },
  });

  let nextNumber = 1;

  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.code.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Valida que una URL sea de SharePoint
 */
export function isValidSharePointUrl(url: string): boolean {
  if (!url) return true; // Vacío es válido (opcional)
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".sharepoint.com") ||
      parsed.hostname.includes("sharepoint")
    );
  } catch {
    return false;
  }
}

/**
 * Parsea un array de emails desde JSON o string separado por comas
 */
export function parseEmailsArray(input: string | null | undefined): string[] {
  if (!input) return [];

  try {
    // Intentar parsear como JSON
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((e) => isValidEmail(e));
    }
  } catch {
    // Si no es JSON, separar por comas
    return input
      .split(",")
      .map((e) => e.trim())
      .filter((e) => isValidEmail(e));
  }

  return [];
}

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formatea horas para mostrar
 */
export function formatHours(hours: number): string {
  if (hours === 0) return "0h";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}min`;
}

/**
 * Calcula el porcentaje de horas usadas
 */
export function calculateHoursPercentage(
  usedHours: number,
  totalHours: number
): number {
  if (totalHours === 0) return 0;
  return Math.round((usedHours / totalHours) * 100);
}

/**
 * Obtiene el color según el porcentaje de uso
 */
export function getHoursStatusColor(percentUsed: number): {
  bg: string;
  text: string;
  badge: string;
} {
  if (percentUsed >= 90) {
    return {
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-700 dark:text-red-400",
      badge: "destructive",
    };
  }
  if (percentUsed >= 80) {
    return {
      bg: "bg-orange-100 dark:bg-orange-950",
      text: "text-orange-700 dark:text-orange-400",
      badge: "warning",
    };
  }
  if (percentUsed >= 60) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-400",
      badge: "secondary",
    };
  }
  return {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    badge: "success",
  };
}

// Configuración de etapas del ticket
export const TICKET_STAGES = {
  BACKLOG: {
    label: "Backlog",
    color: "bg-slate-500",
    textColor: "text-slate-500",
    description: "Ticket recién creado, sin evaluar",
  },
  EVALUACION: {
    label: "Evaluación",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    description: "Se está estimando horas/prioridad",
  },
  EN_ESPERA: {
    label: "En Espera",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    description: "Esperando información del cliente",
  },
  ATENDIENDO: {
    label: "Atendiendo",
    color: "bg-purple-500",
    textColor: "text-purple-500",
    description: "En desarrollo/resolución",
  },
  ATENDIDO: {
    label: "Atendido",
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Resuelto",
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-red-500",
    textColor: "text-red-500",
    description: "Ticket cancelado",
  },
} as const;

export type TicketStageKey = keyof typeof TICKET_STAGES;

// Configuración de tipos de ticket
export const TICKET_TYPES = {
  INCIDENCIA: {
    label: "Incidencia",
    color: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    description: "Error o falla en el sistema",
  },
  CAMBIO: {
    label: "Cambio",
    color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    description: "Solicitud de cambio en proceso existente",
  },
  MEJORA: {
    label: "Mejora",
    color: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    description: "Mejora o nueva funcionalidad",
  },
} as const;

export type TicketTypeKey = keyof typeof TICKET_TYPES;

// Configuración de prioridades
export const TICKET_PRIORITIES = {
  ALTA: {
    label: "Alta",
    color: "bg-red-500",
    textColor: "text-red-500",
    order: 1,
  },
  MEDIA: {
    label: "Media",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    order: 2,
  },
  BAJA: {
    label: "Baja",
    color: "bg-green-500",
    textColor: "text-green-500",
    order: 3,
  },
} as const;

export type TicketPriorityKey = keyof typeof TICKET_PRIORITIES;

// Configuración de estados de bolsa
export const POOL_STATUSES = {
  ACTIVA: {
    label: "Activa",
    color: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400",
  },
  PAUSADA: {
    label: "Pausada",
    color: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400",
  },
  CERRADA: {
    label: "Cerrada",
    color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400",
  },
  AGOTADA: {
    label: "Agotada",
    color: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  },
} as const;

export type PoolStatusKey = keyof typeof POOL_STATUSES;

/**
 * Transiciones válidas de etapas del ticket
 */
export function getValidTransitions(currentStage: TicketStageKey): TicketStageKey[] {
  const transitions: Record<TicketStageKey, TicketStageKey[]> = {
    BACKLOG: ["EVALUACION", "CANCELADO"],
    EVALUACION: ["EN_ESPERA", "ATENDIENDO", "CANCELADO"],
    EN_ESPERA: ["EVALUACION", "ATENDIENDO", "CANCELADO"],
    ATENDIENDO: ["EN_ESPERA", "ATENDIDO", "CANCELADO"],
    ATENDIDO: ["ATENDIENDO"], // Permite reabrir si no se resolvió bien
    CANCELADO: ["BACKLOG"], // Permite reactivar un ticket cancelado
  };

  return transitions[currentStage] || [];
}

/**
 * Verifica si una transición de etapa es válida
 */
export function isValidStageTransition(
  from: TicketStageKey,
  to: TicketStageKey
): boolean {
  return getValidTransitions(from).includes(to);
}
