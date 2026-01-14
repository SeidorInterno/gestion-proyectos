"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";
import { EventStatus, EventCategory, Priority } from "@prisma/client";
import { logCreate, logUpdate, logSoftDelete, logStatusChange } from "@/lib/audit";

export async function updateEventStatus(eventId: string, newStatus: string) {
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  const validStatuses: EventStatus[] = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"];
  if (!validStatuses.includes(newStatus as EventStatus)) {
    throw new Error("Estado no valido");
  }

  const oldEvent = await prisma.projectEvent.findUnique({
    where: { id: eventId },
  });

  if (!oldEvent) {
    throw new Error("Evento no encontrado");
  }

  const event = await prisma.projectEvent.update({
    where: { id: eventId },
    data: {
      status: newStatus as EventStatus,
    },
  });

  revalidatePath("/dashboard/eventos");
  revalidatePath(`/dashboard/proyectos/${event.projectId}`);

  // Audit log
  await logStatusChange("Event", eventId, oldEvent.status, newStatus);

  return event;
}

interface UpdateEventData {
  title: string;
  description?: string;
  category: EventCategory;
  priority?: Priority;
  status: EventStatus;
  dueDate?: Date | null;
  assignedToId?: string | null;
}

export async function updateEvent(eventId: string, data: UpdateEventData) {
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  const event = await prisma.projectEvent.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
      assignedToId: data.assignedToId,
    },
  });

  revalidatePath("/dashboard/eventos");
  revalidatePath(`/dashboard/proyectos/${event.projectId}`);

  return event;
}

export async function deleteEvent(eventId: string) {
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const event = await prisma.projectEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Evento no encontrado");
  }

  if (event.deletedAt) {
    throw new Error("El evento ya fue eliminado");
  }

  // Soft delete instead of hard delete
  await prisma.projectEvent.update({
    where: { id: eventId },
    data: {
      deletedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/eventos");
  revalidatePath(`/dashboard/proyectos/${event.projectId}`);

  // Audit log
  await logSoftDelete("Event", eventId, {
    title: event.title,
    category: event.category,
    status: event.status,
    projectId: event.projectId,
  });

  return { success: true };
}
