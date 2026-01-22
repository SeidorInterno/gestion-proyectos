"use server";

import { prisma } from "@/lib/prisma";

// Mensajes amigables para el usuario (no técnicos)
const TICKET_MESSAGES = {
  created: (code: string) =>
    `Recibimos tu solicitud #${code}. Te avisamos cuando empecemos.`,
  assigned: (code: string, userName: string) =>
    `¡Buenas noticias! ${userName} está revisando tu ticket #${code}.`,
  inProgress: (code: string) =>
    `Tu ticket #${code} está siendo atendido. Te mantenemos informado.`,
  waiting: (code: string) =>
    `Necesitamos más info para tu ticket #${code}. Por favor revisá los comentarios.`,
  resolved: (code: string) =>
    `Tu ticket #${code} fue resuelto. ¿Todo bien?`,
  comment: (code: string) =>
    `Nueva respuesta en tu ticket #${code}`,
  poolLowHours: (poolName: string, remainingPercent: number) =>
    `La bolsa "${poolName}" tiene solo ${remainingPercent}% de horas disponibles.`,
  poolExhausted: (poolName: string) =>
    `¡Alerta! La bolsa "${poolName}" se ha agotado.`,
};

interface CreateTicketNotificationParams {
  type:
    | "TICKET_CREATED"
    | "TICKET_ASSIGNED"
    | "TICKET_STAGE_CHANGE"
    | "TICKET_COMMENT"
    | "TICKET_RESOLVED"
    | "SUPPORT_POOL_ASSIGNED"
    | "SUPPORT_POOL_LOW_HOURS"
    | "SUPPORT_POOL_EXHAUSTED";
  title: string;
  message: string;
  userId: string;
}

async function createTicketNotification({
  type,
  title,
  message,
  userId,
}: CreateTicketNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
      },
    });
  } catch (error) {
    console.error("Error creating ticket notification:", error);
    return null;
  }
}

/**
 * Notifica cuando se crea un nuevo ticket
 */
export async function notifyTicketCreated(
  ticketCode: string,
  poolId: string
) {
  // Notificar a todos los asignados de la bolsa
  const assignments = await prisma.supportPoolAssignment.findMany({
    where: { poolId, active: true },
    select: { userId: true },
  });

  await Promise.all(
    assignments.map((a) =>
      createTicketNotification({
        type: "TICKET_CREATED",
        title: "Nuevo ticket de soporte",
        message: TICKET_MESSAGES.created(ticketCode),
        userId: a.userId,
      })
    )
  );
}

/**
 * Notifica cuando se asigna un ticket a un usuario
 */
export async function notifyTicketAssigned(
  ticketCode: string,
  assignedToId: string,
  assignedByName: string
) {
  return createTicketNotification({
    type: "TICKET_ASSIGNED",
    title: "Ticket asignado",
    message: `Se te asignó el ticket #${ticketCode} por ${assignedByName}.`,
    userId: assignedToId,
  });
}

/**
 * Notifica cambio de etapa del ticket
 */
export async function notifyTicketStageChange(
  ticketCode: string,
  newStage: string,
  poolId: string
) {
  const stageMessages: Record<string, { title: string; getMessage: (code: string) => string }> = {
    ATENDIENDO: {
      title: "Ticket en atención",
      getMessage: TICKET_MESSAGES.inProgress,
    },
    EN_ESPERA: {
      title: "Esperando información",
      getMessage: TICKET_MESSAGES.waiting,
    },
    ATENDIDO: {
      title: "Ticket resuelto",
      getMessage: TICKET_MESSAGES.resolved,
    },
  };

  const config = stageMessages[newStage];
  if (!config) return;

  // Notificar al equipo de la bolsa
  const assignments = await prisma.supportPoolAssignment.findMany({
    where: { poolId, active: true },
    select: { userId: true },
  });

  await Promise.all(
    assignments.map((a) =>
      createTicketNotification({
        type: "TICKET_STAGE_CHANGE",
        title: config.title,
        message: config.getMessage(ticketCode),
        userId: a.userId,
      })
    )
  );
}

/**
 * Notifica cuando se agrega un comentario público
 */
export async function notifyTicketComment(
  ticketCode: string,
  ticketId: string,
  authorId: string
) {
  // Obtener el ticket para saber quién es el creador
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { createdById: true, assignedToId: true },
  });

  if (!ticket) return;

  const usersToNotify = new Set<string>();

  // Notificar al creador si no es el autor del comentario
  if (ticket.createdById !== authorId) {
    usersToNotify.add(ticket.createdById);
  }

  // Notificar al asignado si no es el autor
  if (ticket.assignedToId && ticket.assignedToId !== authorId) {
    usersToNotify.add(ticket.assignedToId);
  }

  await Promise.all(
    Array.from(usersToNotify).map((userId) =>
      createTicketNotification({
        type: "TICKET_COMMENT",
        title: "Nuevo comentario",
        message: TICKET_MESSAGES.comment(ticketCode),
        userId,
      })
    )
  );
}

/**
 * Notifica cuando una bolsa tiene pocas horas (<20%)
 */
export async function notifySupportPoolLowHours(
  poolId: string,
  poolName: string,
  remainingPercent: number
) {
  // Notificar a MANAGERS y ARQUITECTOS asignados a la bolsa
  const assignments = await prisma.supportPoolAssignment.findMany({
    where: { poolId, active: true },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  const managersAndArchitects = assignments.filter(
    (a) =>
      a.user.role.code === "MANAGER" || a.user.role.code === "ARQUITECTO_RPA"
  );

  await Promise.all(
    managersAndArchitects.map((a) =>
      createTicketNotification({
        type: "SUPPORT_POOL_LOW_HOURS",
        title: "Bolsa con horas bajas",
        message: TICKET_MESSAGES.poolLowHours(poolName, remainingPercent),
        userId: a.userId,
      })
    )
  );
}

/**
 * Notifica cuando una bolsa se agota
 */
export async function notifySupportPoolExhausted(
  poolId: string,
  poolName: string
) {
  // Notificar a todos los asignados de la bolsa
  const assignments = await prisma.supportPoolAssignment.findMany({
    where: { poolId, active: true },
    select: { userId: true },
  });

  await Promise.all(
    assignments.map((a) =>
      createTicketNotification({
        type: "SUPPORT_POOL_EXHAUSTED",
        title: "¡Bolsa agotada!",
        message: TICKET_MESSAGES.poolExhausted(poolName),
        userId: a.userId,
      })
    )
  );
}

/**
 * Notifica cuando se asigna un recurso a una bolsa
 */
export async function notifySupportPoolAssignment(
  userId: string,
  poolName: string
) {
  return createTicketNotification({
    type: "SUPPORT_POOL_ASSIGNED",
    title: "Asignado a bolsa de soporte",
    message: `Has sido asignado a la bolsa de soporte "${poolName}".`,
    userId,
  });
}

/**
 * Calcula las horas usadas de una bolsa
 */
export async function calculatePoolUsedHours(poolId: string): Promise<number> {
  const result = await prisma.ticketTimeEntry.aggregate({
    where: {
      ticket: {
        poolId,
        deletedAt: null,
      },
    },
    _sum: {
      hours: true,
    },
  });

  return result._sum.hours || 0;
}

/**
 * Verifica el estado de horas de una bolsa y notifica si es necesario
 */
export async function checkPoolHoursAndNotify(poolId: string) {
  const pool = await prisma.supportPool.findUnique({
    where: { id: poolId },
    select: { id: true, name: true, totalHours: true, status: true },
  });

  if (!pool || pool.status !== "ACTIVA") return;

  const usedHours = await calculatePoolUsedHours(poolId);
  const remainingPercent = Math.round(
    ((pool.totalHours - usedHours) / pool.totalHours) * 100
  );

  if (remainingPercent <= 0) {
    // Actualizar estado a AGOTADA
    await prisma.supportPool.update({
      where: { id: poolId },
      data: { status: "AGOTADA" },
    });
    await notifySupportPoolExhausted(poolId, pool.name);
  } else if (remainingPercent <= 20) {
    await notifySupportPoolLowHours(poolId, pool.name, remainingPercent);
  }
}
