"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, type RoleCode } from "@/lib/auth-utils";
import { z } from "zod";
import { logCreate, logUpdate } from "@/lib/audit";

const timeEntrySchema = z.object({
  date: z.date(),
  hours: z.number().min(0.5, "Mínimo 0.5 horas").max(24, "Máximo 24 horas"),
  description: z.string().min(1, "La descripción es requerida").max(500, "Máximo 500 caracteres"),
  task: z.string().optional(),
  projectId: z.string().min(1, "El proyecto es requerido"),
  activityId: z.string().optional(),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

export async function createTimeEntry(data: TimeEntryInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const validated = timeEntrySchema.parse(data);

  // Verificar que no sea fecha futura
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (validated.date > today) {
    throw new Error("No se pueden registrar horas en fechas futuras");
  }

  // Verificar que el usuario esté asignado al proyecto
  const assignment = await prisma.projectAssignment.findUnique({
    where: {
      projectId_userId: {
        projectId: validated.projectId,
        userId,
      },
    },
  });

  if (!assignment) {
    throw new Error("No estás asignado a este proyecto");
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      date: validated.date,
      hours: validated.hours,
      description: validated.description,
      task: validated.task || null,
      projectId: validated.projectId,
      userId,
      activityId: validated.activityId || null,
    },
  });

  revalidatePath("/dashboard/timetracking");

  await logCreate("TimeEntry", timeEntry.id, {
    date: timeEntry.date.toISOString(),
    hours: timeEntry.hours,
    projectId: timeEntry.projectId,
  });

  return timeEntry;
}

export async function updateTimeEntry(
  id: string,
  data: Partial<TimeEntryInput>
) {
  const session = await requireAuth();
  const userId = session.user.id;
  const userRole = session.user.roleCode as RoleCode;

  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id },
  });

  if (!timeEntry) {
    throw new Error("Entrada no encontrada");
  }

  // Solo el autor puede editar, excepto MANAGER y ARQUITECTO
  const canEditAny = ["MANAGER", "ARQUITECTO_RPA"].includes(userRole);
  if (timeEntry.userId !== userId && !canEditAny) {
    throw new Error("No tienes permisos para editar esta entrada");
  }

  // Validar fecha si se cambia
  if (data.date) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (data.date > today) {
      throw new Error("No se pueden registrar horas en fechas futuras");
    }
  }

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      date: data.date,
      hours: data.hours,
      description: data.description,
      task: data.task,
      activityId: data.activityId,
    },
  });

  revalidatePath("/dashboard/timetracking");

  await logUpdate(
    "TimeEntry",
    id,
    timeEntry as Record<string, unknown>,
    updated as Record<string, unknown>
  );

  return updated;
}

export async function deleteTimeEntry(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;
  const userRole = session.user.roleCode as RoleCode;

  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id },
  });

  if (!timeEntry) {
    throw new Error("Entrada no encontrada");
  }

  // Solo el autor puede eliminar, excepto MANAGER y ARQUITECTO
  const canDeleteAny = ["MANAGER", "ARQUITECTO_RPA"].includes(userRole);
  if (timeEntry.userId !== userId && !canDeleteAny) {
    throw new Error("No tienes permisos para eliminar esta entrada");
  }

  await prisma.timeEntry.delete({
    where: { id },
  });

  revalidatePath("/dashboard/timetracking");
}

export async function getTimeEntries(filters?: {
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  userId?: string;
}) {
  const session = await requireAuth();
  const currentUserId = session.user.id;
  const userRole = session.user.roleCode as RoleCode;

  // ANALISTA y CONSULTOR solo ven sus propias entradas
  const canViewAll = ["MANAGER", "ARQUITECTO_RPA"].includes(userRole);

  const where: Record<string, unknown> = {};

  // Filtro de usuario
  if (!canViewAll) {
    where.userId = currentUserId;
  } else if (filters?.userId) {
    where.userId = filters.userId;
  }

  // Filtro de fechas
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) {
      (where.date as Record<string, Date>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.date as Record<string, Date>).lte = filters.endDate;
    }
  }

  // Filtro de proyecto
  if (filters?.projectId) {
    where.projectId = filters.projectId;
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          pep: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      activity: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return entries;
}

export async function getUserAssignedProjects() {
  const session = await requireAuth();
  const userId = session.user.id;

  const assignments = await prisma.projectAssignment.findMany({
    where: {
      userId,
      active: true,
      project: {
        deletedAt: null,
        status: { not: "CANCELADO" },
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          pep: true,
          phases: {
            include: {
              activities: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  return assignments.map((a) => a.project);
}

export async function getTimeEntriesStats() {
  const session = await requireAuth();
  const userId = session.user.id;

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [weekEntries, monthEntries, projectsCount] = await Promise.all([
    prisma.timeEntry.aggregate({
      where: {
        userId,
        date: { gte: startOfWeek },
      },
      _sum: { hours: true },
    }),
    prisma.timeEntry.aggregate({
      where: {
        userId,
        date: { gte: startOfMonth },
      },
      _sum: { hours: true },
    }),
    prisma.projectAssignment.count({
      where: {
        userId,
        active: true,
        project: {
          deletedAt: null,
          status: { in: ["PLANIFICACION", "EN_PROGRESO"] },
        },
      },
    }),
  ]);

  return {
    weekHours: weekEntries._sum.hours || 0,
    monthHours: monthEntries._sum.hours || 0,
    activeProjects: projectsCount,
  };
}
