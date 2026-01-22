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

/**
 * Genera un código único de proyecto con formato PRJ-XXX
 * Ejemplo: PRJ-001, PRJ-002, PRJ-003...
 */
async function generateProjectCode(): Promise<string> {
  const lastProject = await prisma.project.findFirst({
    where: { code: { not: null } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let nextNumber = 1;
  if (lastProject?.code) {
    const match = lastProject.code.match(/PRJ-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `PRJ-${nextNumber.toString().padStart(3, "0")}`;
}

const phaseDurationsSchema = z.object({
  prepare: z.number().min(1),
  connect: z.number().min(1),
  realize: z.number().min(1),
  run: z.number().min(1),
}).optional();

const projectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  pep: z.string().min(1, "El código PEP es requerido"),
  clientId: z.string().min(1, "El cliente es requerido"),
  managerId: z.string().optional(),
  tool: z.string().default("UIPATH"),
  startDate: z.date().optional(),
  phaseDurations: phaseDurationsSchema,
});

export async function createProject(data: {
  name: string;
  description?: string;
  pep: string;
  clientId: string;
  managerId?: string;
  tool?: string;
  startDate?: Date;
  phaseDurations?: PhaseDurations;
}) {
  // Solo MANAGER y ARQUITECTO_RPA pueden crear proyectos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const validated = projectSchema.parse(data);

  // Generar código único para el proyecto
  const code = await generateProjectCode();

  // Crear el proyecto
  const project = await prisma.project.create({
    data: {
      name: validated.name,
      code,
      pep: validated.pep,
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

export async function setProjectBaseline(projectId: string, baselineEndDate: Date) {
  // Solo MANAGER puede establecer baseline
  await requireRole(["MANAGER"]);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      baselineEndDate,
    },
  });

  revalidatePath(`/dashboard/proyectos/${projectId}`);

  // Audit log
  await logUpdate("Project", projectId,
    { baselineEndDate: null },
    { baselineEndDate: baselineEndDate.toISOString() }
  );

  return project;
}

export async function updateProjectConfig(
  projectId: string,
  config: {
    baselineEndDate?: Date;
  }
) {
  // Solo MANAGER puede actualizar configuración
  await requireRole(["MANAGER"]);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      baselineEndDate: config.baselineEndDate,
    },
  });

  revalidatePath(`/dashboard/proyectos/${projectId}`);
  return project;
}

export async function updateActivityProgress(
  activityId: string,
  progress: number,
  status?: string
) {
  // MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden actualizar progreso
  await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  // Obtener la actividad con su fase para verificar jerarquía
  const currentActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      phase: {
        include: {
          activities: true,
        },
      },
    },
  });

  if (!currentActivity) {
    throw new Error("Actividad no encontrada");
  }

  // Actualizar la actividad principal
  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      progress,
      status: status as any,
    },
  });

  // Verificar jerarquía para propagación automática
  const codeParts = currentActivity.code.split(".");
  const isItem = codeParts.length === 2;
  const isSubItem = codeParts.length >= 3;

  // CASO 1: Item al 100% → Actualizar todos sus SubItems al 100%
  if (isItem && progress === 100) {
    const itemCode = currentActivity.code;
    const subItems = currentActivity.phase.activities.filter((a) => {
      const subParts = a.code.split(".");
      if (subParts.length < 3) return false;
      const parentCode = subParts.slice(0, 2).join(".");
      return parentCode === itemCode;
    });

    if (subItems.length > 0) {
      await prisma.activity.updateMany({
        where: {
          id: { in: subItems.map((s) => s.id) },
        },
        data: {
          progress: 100,
          status: "COMPLETADO",
        },
      });
    }
  }

  // CASO 2: SubItem al 100% → Verificar si todos los hermanos están al 100%
  // Si es así, actualizar el Item padre al 100%
  if (isSubItem && progress === 100) {
    const parentCode = codeParts.slice(0, 2).join(".");

    // Buscar el Item padre
    const parentItem = currentActivity.phase.activities.find(
      (a) => a.code === parentCode
    );

    if (parentItem) {
      // Buscar todos los SubItems hermanos (incluyendo el actual)
      const allSiblings = currentActivity.phase.activities.filter((a) => {
        const subParts = a.code.split(".");
        if (subParts.length < 3) return false;
        return subParts.slice(0, 2).join(".") === parentCode;
      });

      // Verificar si todos los hermanos están al 100% (considerando el update actual)
      const allCompleted = allSiblings.every((sibling) => {
        if (sibling.id === activityId) return progress === 100;
        return sibling.progress === 100;
      });

      if (allCompleted) {
        await prisma.activity.update({
          where: { id: parentItem.id },
          data: {
            progress: 100,
            status: "COMPLETADO",
          },
        });
      }
    }
  }

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

  // Obtener la actividad actual con su fase
  const currentActivity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      phase: {
        include: {
          activities: true,
        },
      },
    },
  });

  if (!currentActivity) {
    throw new Error("Actividad no encontrada");
  }

  // Verificar si es un SubItem (código tipo X.X.X)
  const codeParts = currentActivity.code.split(".");
  const isSubItem = codeParts.length >= 3;

  if (isSubItem) {
    // Obtener código del Item padre (X.X)
    const parentCode = codeParts.slice(0, 2).join(".");

    // Buscar el Item padre en la misma fase
    const parentActivity = currentActivity.phase.activities.find(
      (a) => a.code === parentCode
    );

    if (parentActivity) {
      // Usar fechas baseline del padre como límites, o fechas actuales si no hay baseline
      const parentStart = parentActivity.baselineStartDate || parentActivity.startDate;
      const parentEnd = parentActivity.baselineEndDate || parentActivity.endDate;

      if (parentStart && parentEnd) {
        const parentStartTime = new Date(parentStart).getTime();
        const parentEndTime = new Date(parentEnd).getTime();
        const newStartTime = new Date(startDate).getTime();
        const newEndTime = new Date(endDate).getTime();

        // Validar que no exceda los límites del padre
        if (newStartTime < parentStartTime) {
          throw new Error(
            `El SubItem no puede iniciar antes que su Item padre (${new Date(parentStart).toLocaleDateString("es-PE")})`
          );
        }
        if (newEndTime > parentEndTime) {
          throw new Error(
            `El SubItem no puede terminar después que su Item padre (${new Date(parentEnd).toLocaleDateString("es-PE")})`
          );
        }
      }
    }
  }

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

// Mover un Item padre junto con todos sus SubItems
export async function moveItemWithSubItems(
  itemId: string,
  daysOffset: number
) {
  // Solo MANAGER y ARQUITECTO_RPA pueden mover Items
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  // Obtener el Item con su fase y actividades
  const item = await prisma.activity.findUnique({
    where: { id: itemId },
    include: {
      phase: {
        include: {
          activities: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error("Item no encontrado");
  }

  // Verificar que es un Item (código tipo X.X)
  const codeParts = item.code.split(".");
  if (codeParts.length !== 2) {
    throw new Error("Solo se pueden mover Items padres");
  }

  // Buscar todos los SubItems de este Item
  const itemCode = item.code;
  const subItems = item.phase.activities.filter((a) => {
    const subParts = a.code.split(".");
    if (subParts.length < 3) return false;
    const parentCode = subParts.slice(0, 2).join(".");
    return parentCode === itemCode;
  });

  // Función para agregar días a una fecha
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Actualizar todas las actividades (Item + SubItems)
  const allActivities = [item, ...subItems];

  for (const activity of allActivities) {
    if (activity.startDate && activity.endDate) {
      await prisma.activity.update({
        where: { id: activity.id },
        data: {
          startDate: addDays(new Date(activity.startDate), daysOffset),
          endDate: addDays(new Date(activity.endDate), daysOffset),
        },
      });
    }
  }

  // También actualizar las fechas baseline del Item padre
  if (item.baselineStartDate && item.baselineEndDate) {
    await prisma.activity.update({
      where: { id: item.id },
      data: {
        baselineStartDate: addDays(new Date(item.baselineStartDate), daysOffset),
        baselineEndDate: addDays(new Date(item.baselineEndDate), daysOffset),
      },
    });
  }

  revalidatePath("/dashboard/proyectos");
  return { success: true, movedCount: allActivities.length };
}

export async function deleteProject(id: string) {
  // Solo MANAGER puede eliminar proyectos
  await requireRole(["MANAGER"]);

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

  // Hard delete - cascade eliminará fases, actividades, asignaciones y eventos
  await prisma.project.delete({
    where: { id },
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
