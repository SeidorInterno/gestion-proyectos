"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, requireAuth } from "@/lib/auth-utils";
import { logCreate, logUpdate, logSoftDelete } from "@/lib/audit";
import {
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketStageChange,
  notifyTicketComment,
  checkPoolHoursAndNotify,
} from "@/lib/ticket-notifications";
import {
  generateTicketCode,
  isValidStageTransition,
  type TicketStageKey,
} from "@/lib/support-utils";
import type { TicketStage, TicketType, TicketPriority } from "@prisma/client";

// ==================== FLOWS ====================

interface CreateFlowInput {
  name: string;
  description?: string;
  poolId: string;
}

export async function createFlow(input: CreateFlowInput) {
  await requirePermission("supportFlows", "create");

  const flow = await prisma.supportFlow.create({
    data: {
      name: input.name,
      description: input.description,
      poolId: input.poolId,
    },
  });

  await logCreate("SupportFlow", flow.id, flow);
  revalidatePath(`/dashboard/soporte/${input.poolId}`);

  return flow;
}

export async function updateFlow(
  id: string,
  data: { name?: string; description?: string; active?: boolean }
) {
  await requirePermission("supportFlows", "update");

  const existing = await prisma.supportFlow.findUnique({ where: { id } });
  if (!existing) throw new Error("Flujo no encontrado");

  const flow = await prisma.supportFlow.update({
    where: { id },
    data,
  });

  await logUpdate("SupportFlow", id, existing, flow);
  revalidatePath(`/dashboard/soporte/${existing.poolId}`);

  return flow;
}

export async function deleteFlow(id: string) {
  await requirePermission("supportFlows", "delete");

  const flow = await prisma.supportFlow.findUnique({
    where: { id },
    include: {
      _count: { select: { tickets: { where: { deletedAt: null } } } },
    },
  });

  if (!flow) throw new Error("Flujo no encontrado");

  if (flow._count.tickets > 0) {
    // Desactivar en lugar de eliminar
    await prisma.supportFlow.update({
      where: { id },
      data: { active: false },
    });
  } else {
    await prisma.supportFlow.delete({ where: { id } });
  }

  revalidatePath(`/dashboard/soporte/${flow.poolId}`);
}

// ==================== TICKETS ====================

interface CreateTicketInput {
  poolId: string;
  flowId?: string;
  projectId?: string;
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  screenshotUrl?: string;
  excelUrl?: string;
  incidentDate?: Date;
  reporterEmail: string;
  ccEmails?: string[];
  estimatedHours?: number;
  assignedToId?: string;
}

export async function createTicket(input: CreateTicketInput) {
  const session = await requirePermission("tickets", "create");

  const code = await generateTicketCode();

  // Verificar si hay auto-aceptación
  const pool = await prisma.supportPool.findUnique({
    where: { id: input.poolId },
    select: { autoAcceptThreshold: true, status: true },
  });

  if (!pool) throw new Error("Bolsa de soporte no encontrada");

  if (pool.status !== "ACTIVA") {
    throw new Error("No se pueden crear tickets en una bolsa que no está activa");
  }

  const autoAccepted =
    input.estimatedHours &&
    pool.autoAcceptThreshold &&
    input.estimatedHours <= pool.autoAcceptThreshold;

  const ticket = await prisma.supportTicket.create({
    data: {
      code,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      stage: autoAccepted ? "EVALUACION" : "BACKLOG",
      screenshotUrl: input.screenshotUrl,
      excelUrl: input.excelUrl,
      incidentDate: input.incidentDate,
      reporterEmail: input.reporterEmail,
      ccEmails: input.ccEmails ? JSON.stringify(input.ccEmails) : null,
      estimatedHours: input.estimatedHours,
      autoAccepted: autoAccepted || false,
      poolId: input.poolId,
      flowId: input.flowId,
      projectId: input.projectId,
      assignedToId: input.assignedToId,
      createdById: session.user.id,
    },
  });

  // Crear entrada en historial
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      userId: session.user.id,
      field: "stage",
      oldValue: null,
      newValue: ticket.stage,
    },
  });

  await logCreate("SupportTicket", ticket.id, ticket);
  await notifyTicketCreated(code, input.poolId);
  revalidatePath(`/dashboard/soporte/${input.poolId}`);

  return ticket;
}

interface UpdateTicketInput {
  flowId?: string | null;
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  screenshotUrl?: string | null;
  excelUrl?: string | null;
  incidentDate?: Date | null;
  reporterEmail?: string;
  ccEmails?: string[] | null;
  estimatedHours?: number | null;
  assignedToId?: string | null;
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  const session = await requirePermission("tickets", "update");

  const existing = await prisma.supportTicket.findUnique({
    where: { id },
    include: { assignedTo: { select: { name: true } } },
  });

  if (!existing) throw new Error("Ticket no encontrado");

  // Si cambia la asignación, notificar
  const assigneeChanged =
    "assignedToId" in input && input.assignedToId !== existing.assignedToId;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...input,
      ccEmails: input.ccEmails ? JSON.stringify(input.ccEmails) : input.ccEmails,
    },
  });

  // Registrar cambios en historial
  const fieldsToTrack = ["priority", "type", "assignedToId", "estimatedHours"];
  for (const field of fieldsToTrack) {
    if (field in input) {
      const oldValue = existing[field as keyof typeof existing];
      const newValue = input[field as keyof typeof input];
      if (String(oldValue) !== String(newValue)) {
        await prisma.ticketHistory.create({
          data: {
            ticketId: id,
            userId: session.user.id,
            field,
            oldValue: oldValue ? String(oldValue) : null,
            newValue: newValue ? String(newValue) : null,
          },
        });
      }
    }
  }

  await logUpdate("SupportTicket", id, existing, ticket);

  if (assigneeChanged && input.assignedToId) {
    await notifyTicketAssigned(
      existing.code,
      input.assignedToId,
      session.user.name || "Sistema"
    );
  }

  revalidatePath(`/dashboard/soporte/${existing.poolId}`);
  revalidatePath(`/dashboard/soporte/${existing.poolId}/${id}`);

  return ticket;
}

export async function updateTicketStage(id: string, newStage: TicketStage) {
  const session = await requirePermission("tickets", "update");

  const existing = await prisma.supportTicket.findUnique({
    where: { id },
    select: { stage: true, poolId: true, code: true },
  });

  if (!existing) throw new Error("Ticket no encontrado");

  // Validar transición
  if (
    !isValidStageTransition(
      existing.stage as TicketStageKey,
      newStage as TicketStageKey
    )
  ) {
    throw new Error(
      `No se puede cambiar de ${existing.stage} a ${newStage}`
    );
  }

  const updateData: Record<string, unknown> = { stage: newStage };

  // Actualizar fechas según el estado
  if (newStage === "ATENDIENDO" && !existing.stage.includes("ATENDIENDO")) {
    updateData.startedAt = new Date();
  }
  if (newStage === "ATENDIDO") {
    updateData.resolvedAt = new Date();
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
  });

  // Historial
  await prisma.ticketHistory.create({
    data: {
      ticketId: id,
      userId: session.user.id,
      field: "stage",
      oldValue: existing.stage,
      newValue: newStage,
    },
  });

  await notifyTicketStageChange(existing.code, newStage, existing.poolId);
  revalidatePath(`/dashboard/soporte/${existing.poolId}`);

  return ticket;
}

export async function deleteTicket(id: string) {
  const session = await requirePermission("tickets", "delete");

  const existing = await prisma.supportTicket.findUnique({
    where: { id },
    select: { poolId: true },
  });

  if (!existing) throw new Error("Ticket no encontrado");

  // Soft delete
  await prisma.supportTicket.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  await logSoftDelete("SupportTicket", id, existing);
  revalidatePath(`/dashboard/soporte/${existing.poolId}`);
}

// ==================== COMMENTS ====================

interface CreateCommentInput {
  ticketId: string;
  content: string;
  isInternal?: boolean;
}

export async function createComment(input: CreateCommentInput) {
  const session = await requirePermission("ticketComments", "create");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
    select: { code: true, poolId: true },
  });

  if (!ticket) throw new Error("Ticket no encontrado");

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: input.ticketId,
      content: input.content,
      isInternal: input.isInternal || false,
      authorId: session.user.id,
    },
  });

  await logCreate("TicketComment", comment.id, comment);

  // Notificar solo comentarios públicos
  if (!input.isInternal) {
    await notifyTicketComment(ticket.code, input.ticketId, session.user.id);
  }

  revalidatePath(`/dashboard/soporte/${ticket.poolId}/${input.ticketId}`);

  return comment;
}

export async function deleteComment(id: string) {
  await requirePermission("ticketComments", "delete");

  const comment = await prisma.ticketComment.findUnique({
    where: { id },
    include: { ticket: { select: { poolId: true, id: true } } },
  });

  if (!comment) throw new Error("Comentario no encontrado");

  await prisma.ticketComment.delete({ where: { id } });
  revalidatePath(
    `/dashboard/soporte/${comment.ticket.poolId}/${comment.ticket.id}`
  );
}

// ==================== TIME ENTRIES ====================

interface CreateTimeEntryInput {
  ticketId: string;
  date: Date;
  hours: number;
  description: string;
}

export async function createTimeEntry(input: CreateTimeEntryInput) {
  const session = await requirePermission("ticketTime", "create");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
    select: { poolId: true },
  });

  if (!ticket) throw new Error("Ticket no encontrado");

  if (input.hours <= 0 || input.hours > 24) {
    throw new Error("Las horas deben estar entre 0.5 y 24");
  }

  const entry = await prisma.ticketTimeEntry.create({
    data: {
      ticketId: input.ticketId,
      date: input.date,
      hours: input.hours,
      description: input.description,
      userId: session.user.id,
    },
  });

  await logCreate("TicketTimeEntry", entry.id, entry);

  // Verificar horas de la bolsa
  await checkPoolHoursAndNotify(ticket.poolId);

  revalidatePath(`/dashboard/soporte/${ticket.poolId}`);
  revalidatePath(`/dashboard/soporte/${ticket.poolId}/${input.ticketId}`);

  return entry;
}

export async function updateTimeEntry(
  id: string,
  data: { date?: Date; hours?: number; description?: string }
) {
  await requirePermission("ticketTime", "update");

  const existing = await prisma.ticketTimeEntry.findUnique({
    where: { id },
    include: { ticket: { select: { poolId: true, id: true } } },
  });

  if (!existing) throw new Error("Registro de horas no encontrado");

  if (data.hours && (data.hours <= 0 || data.hours > 24)) {
    throw new Error("Las horas deben estar entre 0.5 y 24");
  }

  const entry = await prisma.ticketTimeEntry.update({
    where: { id },
    data,
  });

  // Verificar horas de la bolsa
  await checkPoolHoursAndNotify(existing.ticket.poolId);

  revalidatePath(`/dashboard/soporte/${existing.ticket.poolId}`);
  revalidatePath(
    `/dashboard/soporte/${existing.ticket.poolId}/${existing.ticket.id}`
  );

  return entry;
}

export async function deleteTimeEntry(id: string) {
  await requirePermission("ticketTime", "delete");

  const entry = await prisma.ticketTimeEntry.findUnique({
    where: { id },
    include: { ticket: { select: { poolId: true, id: true } } },
  });

  if (!entry) throw new Error("Registro de horas no encontrado");

  await prisma.ticketTimeEntry.delete({ where: { id } });

  revalidatePath(`/dashboard/soporte/${entry.ticket.poolId}`);
  revalidatePath(
    `/dashboard/soporte/${entry.ticket.poolId}/${entry.ticket.id}`
  );
}

// ==================== ATTACHMENTS ====================

interface CreateAttachmentInput {
  ticketId: string;
  name: string;
  url: string;
  description?: string;
}

export async function createAttachment(input: CreateAttachmentInput) {
  const session = await requireAuth();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: input.ticketId },
    select: { poolId: true },
  });

  if (!ticket) throw new Error("Ticket no encontrado");

  const attachment = await prisma.ticketAttachment.create({
    data: {
      ticketId: input.ticketId,
      name: input.name,
      url: input.url,
      description: input.description,
      uploadedById: session.user.id,
    },
  });

  revalidatePath(`/dashboard/soporte/${ticket.poolId}/${input.ticketId}`);

  return attachment;
}

export async function deleteAttachment(id: string) {
  await requireAuth();

  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id },
    include: { ticket: { select: { poolId: true, id: true } } },
  });

  if (!attachment) throw new Error("Adjunto no encontrado");

  await prisma.ticketAttachment.delete({ where: { id } });

  revalidatePath(
    `/dashboard/soporte/${attachment.ticket.poolId}/${attachment.ticket.id}`
  );
}

// ==================== QUERIES ====================

export async function getTicketById(id: string) {
  await requirePermission("tickets", "read");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id, deletedAt: null },
    include: {
      pool: { select: { id: true, name: true, pep: true } },
      flow: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      timeEntries: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
      history: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) return null;

  // Calcular horas totales
  const totalHours = ticket.timeEntries.reduce((sum, e) => sum + e.hours, 0);

  return {
    ...ticket,
    totalHours,
  };
}
