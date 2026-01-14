"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireAuth } from "@/lib/auth-utils";
import {
  SAM_TEMPLATE,
  generateScaledSAMTemplate,
  getDefaultPhaseDurations,
  type PhaseDurations
} from "@/lib/project-template";
import { calculateEndDate, calculateStartDate, getPeruHolidays } from "@/lib/date-utils";
import { z } from "zod";
import { logCreate, logUpdate, logSoftDelete, logStatusChange, logRestore } from "@/lib/audit";

const phaseDurationsSchema = z.object({
  prepare: z.number().min(1),
  connect: z.number().min(1),
  realize: z.number().min(1),
  run: z.number().min(1),
}).optional();

const projectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  clientId: z.string().min(1, "El cliente es requerido"),
  managerId: z.string().optional(),
  tool: z.string().default("UIPATH"),
  startDate: z.date().optional(),
  phaseDurations: phaseDurationsSchema,
});

export async function createProject(data: {
  name: string;
  description?: string;
  clientId: string;
  managerId?: string;
  tool?: string;
  startDate?: Date;
  phaseDurations?: PhaseDurations;
}) {
  // Solo MANAGER y ARQUITECTO_RPA pueden crear proyectos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const validated = projectSchema.parse(data);

  // Crear el proyecto
  const project = await prisma.project.create({
    data: {
      name: validated.name,
      description: validated.description || null,
      clientId: validated.clientId,
      managerId: validated.managerId || null,
      tool: validated.tool as any,
      startDate: validated.startDate || null,
      status: "PLANIFICACION",
    },
  });

  // Generar estructura SAM con duraciones personalizadas o por defecto
  // La fecha de inicio del proyecto es cuando comienza CONNECT (después del kickoff)
  // PREPARE se calcula hacia atrás desde el día anterior a startDate
  const projectStartDate = validated.startDate || new Date();

  // Obtener feriados del año actual, anterior y siguiente
  const startYear = projectStartDate.getFullYear();
  const holidays = [
    ...getPeruHolidays(startYear - 1),
    ...getPeruHolidays(startYear),
    ...getPeruHolidays(startYear + 1),
  ];

  // Usar duraciones personalizadas o las por defecto
  const customDurations = validated.phaseDurations || getDefaultPhaseDurations();

  // Generar template escalado con las duraciones personalizadas
  const scaledTemplate = generateScaledSAMTemplate(customDurations);

  // Separar PREPARE de las demás fases
  const preparePhase = scaledTemplate.find(p => p.type === "PREPARE");
  const otherPhases = scaledTemplate.filter(p => p.type !== "PREPARE");

  // ============================================
  // CREAR FASE PREPARE (fechas hacia atrás)
  // ============================================
  if (preparePhase) {
    const phase = await prisma.phase.create({
      data: {
        name: preparePhase.name,
        type: preparePhase.type as any,
        order: preparePhase.order,
        projectId: project.id,
      },
    });

    // Calcular fechas de actividades de Prepare hacia atrás
    // El último día de Prepare es el día anterior al inicio del proyecto
    const prepareEndDate = new Date(projectStartDate);
    prepareEndDate.setDate(prepareEndDate.getDate() - 1);

    // Invertir las actividades para calcular de atrás hacia adelante
    const activitiesWithDuration = preparePhase.activities.filter(a => a.defaultDuration > 0);
    const activitiesReversed = [...activitiesWithDuration].reverse();

    // Calcular fechas hacia atrás
    let currentEndDate = new Date(prepareEndDate);
    const activityDates: Map<string, { start: Date; end: Date }> = new Map();

    for (const activity of activitiesReversed) {
      const actEnd = new Date(currentEndDate);
      const actStart = calculateStartDate(actEnd, activity.defaultDuration, holidays);
      activityDates.set(activity.code, { start: actStart, end: actEnd });

      // Mover al día anterior para la siguiente actividad (hacia atrás)
      currentEndDate = new Date(actStart);
      currentEndDate.setDate(currentEndDate.getDate() - 1);
    }

    // Crear actividades en orden original
    for (let i = 0; i < preparePhase.activities.length; i++) {
      const activityTemplate = preparePhase.activities[i];
      const dates = activityDates.get(activityTemplate.code);

      await prisma.activity.create({
        data: {
          code: activityTemplate.code,
          name: activityTemplate.name,
          order: i + 1,
          durationDays: activityTemplate.defaultDuration,
          startDate: dates?.start || null,
          endDate: dates?.end || null,
          participationType: activityTemplate.participationType as any,
          status: "PENDIENTE",
          progress: 0,
          phaseId: phase.id,
        },
      });
    }
  }

  // ============================================
  // CREAR FASES CONNECT, REALIZE, RUN (fechas hacia adelante)
  // ============================================
  let currentStartDate = new Date(projectStartDate);

  for (const phaseTemplate of otherPhases) {
    const phase = await prisma.phase.create({
      data: {
        name: phaseTemplate.name,
        type: phaseTemplate.type as any,
        order: phaseTemplate.order,
        projectId: project.id,
      },
    });

    // Crear las actividades de la fase
    for (let i = 0; i < phaseTemplate.activities.length; i++) {
      const activityTemplate = phaseTemplate.activities[i];

      // Solo calcular fechas si la actividad tiene duración
      let activityStartDate = null;
      let activityEndDate = null;

      if (activityTemplate.defaultDuration > 0) {
        activityStartDate = new Date(currentStartDate);
        activityEndDate = calculateEndDate(
          activityStartDate,
          activityTemplate.defaultDuration,
          holidays
        );
        // Actualizar fecha de inicio para la siguiente actividad
        currentStartDate = new Date(activityEndDate);
        currentStartDate.setDate(currentStartDate.getDate() + 1);
      }

      await prisma.activity.create({
        data: {
          code: activityTemplate.code,
          name: activityTemplate.name,
          order: i + 1,
          durationDays: activityTemplate.defaultDuration,
          startDate: activityStartDate,
          endDate: activityEndDate,
          participationType: activityTemplate.participationType as any,
          status: "PENDIENTE",
          progress: 0,
          phaseId: phase.id,
        },
      });
    }
  }

  revalidatePath("/dashboard/proyectos");

  // Audit log
  await logCreate("Project", project.id, {
    name: project.name,
    clientId: project.clientId,
    status: project.status,
  });

  return project;
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    managerId?: string;
  }
) {
  // Solo MANAGER y ARQUITECTO_RPA pueden actualizar proyectos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  // Get current state for audit
  const oldProject = await prisma.project.findUnique({
    where: { id },
  });

  if (!oldProject) {
    throw new Error("Proyecto no encontrado");
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      status: data.status as any,
      managerId: data.managerId,
    },
  });

  revalidatePath("/dashboard/proyectos");
  revalidatePath(`/dashboard/proyectos/${id}`);

  // Audit log
  if (data.status && data.status !== oldProject.status) {
    await logStatusChange("Project", id, oldProject.status, data.status);
  } else {
    await logUpdate("Project", id, oldProject as Record<string, unknown>, project as Record<string, unknown>);
  }

  return project;
}

export async function updateActivityProgress(
  activityId: string,
  progress: number,
  status?: string
) {
  // MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden actualizar progreso
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      progress,
      status: status as any,
    },
  });

  revalidatePath("/dashboard/proyectos");
  return activity;
}

export async function updateActivityDates(
  activityId: string,
  startDate: Date,
  endDate: Date
) {
  // Solo MANAGER y ARQUITECTO_RPA pueden modificar fechas de actividades
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      startDate,
      endDate,
    },
  });

  revalidatePath("/dashboard/proyectos");
  return activity;
}

export async function deleteProject(id: string) {
  // Solo MANAGER puede eliminar proyectos
  const session = await requireRole(["MANAGER"]);

  // Get project for audit log before soft delete
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          phases: true,
          assignments: true,
          events: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Proyecto no encontrado");
  }

  if (project.deletedAt) {
    throw new Error("El proyecto ya fue eliminado");
  }

  // Soft delete instead of hard delete
  await prisma.project.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/proyectos");

  // Audit log
  await logSoftDelete("Project", id, {
    name: project.name,
    status: project.status,
    phasesCount: project._count.phases,
    assignmentsCount: project._count.assignments,
    eventsCount: project._count.events,
  });
}

export async function restoreProject(id: string) {
  // Solo MANAGER puede restaurar proyectos
  await requireRole(["MANAGER"]);

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new Error("Proyecto no encontrado");
  }

  if (!project.deletedAt) {
    throw new Error("El proyecto no esta eliminado");
  }

  await prisma.project.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });

  revalidatePath("/dashboard/proyectos");

  // Audit log
  await logRestore("Project", id);
}

export async function getDeletedProjects() {
  // Solo MANAGER puede ver proyectos eliminados
  await requireRole(["MANAGER"]);

  return prisma.project.findMany({
    where: {
      deletedAt: { not: null },
    },
    include: {
      client: true,
      manager: true,
    },
    orderBy: { deletedAt: "desc" },
  });
}
