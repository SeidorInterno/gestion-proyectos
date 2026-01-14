"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EventCategory, EventStatus, Priority } from "@prisma/client";
import { requireRole, requireAuth } from "@/lib/auth-utils";

interface CreateEventData {
  projectId: string;
  category: EventCategory;
  type: string;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  impactDays?: number;
  impactCost?: number;
  assignedToId?: string;
  reportedById: string;
  activityId?: string;
}

interface UpdateEventData {
  title?: string;
  description?: string;
  status?: EventStatus;
  priority?: Priority;
  dueDate?: Date;
  endDate?: Date;
  impactDays?: number;
  impactCost?: number;
  assignedToId?: string;
  activityId?: string;
}

// Crear un nuevo evento
export async function createEvent(data: CreateEventData) {
  // MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden crear eventos
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  try {
    const event = await prisma.projectEvent.create({
      data: {
        projectId: data.projectId,
        category: data.category,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        impactDays: data.impactDays,
        impactCost: data.impactCost,
        assignedToId: data.assignedToId,
        reportedById: data.reportedById,
        activityId: data.activityId,
      },
    });

    // Si es un blocker crítico o una PAUSA, pausar el proyecto automáticamente
    if (
      (data.category === "BLOCKER" && data.priority === "CRITICO") ||
      data.category === "PAUSE"
    ) {
      await prisma.project.update({
        where: { id: data.projectId },
        data: { status: "PAUSADO" },
      });
    }

    revalidatePath(`/dashboard/proyectos/${data.projectId}`);
    return { success: true, event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Error al crear el evento" };
  }
}

// Actualizar un evento existente
export async function updateEvent(eventId: string, data: UpdateEventData) {
  // MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden actualizar eventos
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  try {
    const event = await prisma.projectEvent.update({
      where: { id: eventId },
      data,
      include: { project: true },
    });

    revalidatePath(`/dashboard/proyectos/${event.projectId}`);
    return { success: true, event };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Error al actualizar el evento" };
  }
}

// Resolver un evento (cerrar y reactivar proyecto si aplica)
export async function resolveEvent(eventId: string) {
  // MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden resolver eventos
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  try {
    const event = await prisma.projectEvent.update({
      where: { id: eventId },
      data: {
        status: "RESUELTO",
        endDate: new Date(),
      },
      include: { project: true },
    });

    // Si era un blocker crítico o una PAUSA, verificar si se puede reactivar el proyecto
    if (
      (event.category === "BLOCKER" && event.priority === "CRITICO") ||
      event.category === "PAUSE"
    ) {
      // Verificar si hay blockers críticos o pausas activas
      const activeBlockersOrPauses = await prisma.projectEvent.count({
        where: {
          projectId: event.projectId,
          OR: [
            {
              category: "BLOCKER",
              priority: "CRITICO",
              status: { in: ["ABIERTO", "EN_PROGRESO"] },
            },
            {
              category: "PAUSE",
              status: { in: ["ABIERTO", "EN_PROGRESO"] },
            },
          ],
        },
      });

      // Si no hay más blockers críticos ni pausas activas, reactivar el proyecto
      if (activeBlockersOrPauses === 0) {
        await prisma.project.update({
          where: { id: event.projectId },
          data: { status: "EN_PROGRESO" },
        });
      }
    }

    revalidatePath(`/dashboard/proyectos/${event.projectId}`);
    return { success: true, event };
  } catch (error) {
    console.error("Error resolving event:", error);
    return { success: false, error: "Error al resolver el evento" };
  }
}

// Cerrar un evento definitivamente
export async function closeEvent(eventId: string) {
  // MANAGER y ARQUITECTO_RPA pueden cerrar eventos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  try {
    const event = await prisma.projectEvent.update({
      where: { id: eventId },
      data: {
        status: "CERRADO",
        endDate: new Date(),
      },
    });

    revalidatePath(`/dashboard/proyectos/${event.projectId}`);
    return { success: true, event };
  } catch (error) {
    console.error("Error closing event:", error);
    return { success: false, error: "Error al cerrar el evento" };
  }
}

// Eliminar un evento
export async function deleteEvent(eventId: string) {
  // Solo MANAGER y ARQUITECTO_RPA pueden eliminar eventos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  try {
    const event = await prisma.projectEvent.delete({
      where: { id: eventId },
    });

    revalidatePath(`/dashboard/proyectos/${event.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Error al eliminar el evento" };
  }
}

// Obtener eventos de un proyecto
export async function getProjectEvents(projectId: string) {
  // Requiere autenticación para ver eventos
  await requireAuth();

  try {
    const events = await prisma.projectEvent.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        activity: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: "Error al obtener eventos", events: [] };
  }
}

// Obtener resumen de eventos por categoría
export async function getEventsSummary(projectId: string) {
  // Requiere autenticación para ver resumen de eventos
  await requireAuth();

  try {
    const summary = await prisma.projectEvent.groupBy({
      by: ["category", "status"],
      where: { projectId },
      _count: true,
    });

    // Contar blockers activos
    const activeBlockers = await prisma.projectEvent.count({
      where: {
        projectId,
        category: "BLOCKER",
        status: { in: ["ABIERTO", "EN_PROGRESO"] },
      },
    });

    return { success: true, summary, activeBlockers };
  } catch (error) {
    console.error("Error fetching events summary:", error);
    return { success: false, error: "Error al obtener resumen", summary: [], activeBlockers: 0 };
  }
}

// Recalcular fechas del proyecto después de un bloqueo
export async function recalculateProjectDates(projectId: string, daysToAdd: number) {
  // Solo MANAGER y ARQUITECTO_RPA pueden recalcular fechas
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  try {
    // Obtener todas las actividades pendientes o en progreso
    const activities = await prisma.activity.findMany({
      where: {
        phase: { projectId },
        status: { in: ["PENDIENTE", "EN_PROGRESO"] },
      },
      include: {
        phase: true,
      },
    });

    // Actualizar cada actividad sumando los días de impacto
    const updates = activities.map((activity) => {
      const newStartDate = activity.startDate
        ? new Date(activity.startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        : null;
      const newEndDate = activity.endDate
        ? new Date(activity.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        : null;

      return prisma.activity.update({
        where: { id: activity.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      });
    });

    await Promise.all(updates);

    // También actualizar la fecha de fin del proyecto si existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.endDate) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          endDate: new Date(project.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Marcar los blockers resueltos como ya procesados (poner impactDays a 0)
    await prisma.projectEvent.updateMany({
      where: {
        projectId,
        category: "BLOCKER",
        status: { in: ["RESUELTO", "CERRADO"] },
        impactDays: { gt: 0 },
      },
      data: {
        impactDays: 0,
      },
    });

    revalidatePath(`/dashboard/proyectos/${projectId}`);
    return {
      success: true,
      message: `Se actualizaron ${activities.length} actividades (+${daysToAdd} días)`,
    };
  } catch (error) {
    console.error("Error recalculating dates:", error);
    return { success: false, error: "Error al recalcular fechas" };
  }
}
