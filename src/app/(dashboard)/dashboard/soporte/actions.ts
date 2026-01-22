"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, requireAuth } from "@/lib/auth-utils";
import { logCreate, logUpdate, logSoftDelete, logRestore } from "@/lib/audit";
import { notifySupportPoolAssignment } from "@/lib/ticket-notifications";
import type { SupportPoolStatus } from "@prisma/client";

// ==================== TYPES ====================

interface CreateSupportPoolInput {
  name: string;
  description?: string;
  pep: string;
  totalHours: number;
  autoAcceptThreshold?: number;
  clientId: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UpdateSupportPoolInput {
  name?: string;
  description?: string;
  pep?: string;
  totalHours?: number;
  autoAcceptThreshold?: number;
  status?: SupportPoolStatus;
  clientId?: string;
  projectId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

// ==================== QUERIES ====================

export async function getSupportPools() {
  const session = await requirePermission("supportPools", "read");
  const userRole = session.user.roleCode;
  const userId = session.user.id;

  // CONSULTOR solo ve bolsas donde está asignado
  const whereClause =
    userRole === "CONSULTOR"
      ? {
          deletedAt: null,
          assignments: {
            some: {
              userId,
              active: true,
            },
          },
        }
      : { deletedAt: null };

  const pools = await prisma.supportPool.findMany({
    where: whereClause,
    include: {
      client: {
        select: { id: true, name: true },
      },
      project: {
        select: { id: true, name: true },
      },
      assignments: {
        where: { active: true },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: {
          tickets: {
            where: {
              deletedAt: null,
              stage: { notIn: ["ATENDIDO", "CANCELADO"] }, // Solo tickets activos
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcular horas usadas para cada bolsa
  const poolsWithHours = await Promise.all(
    pools.map(async (pool) => {
      const usedHoursResult = await prisma.ticketTimeEntry.aggregate({
        where: {
          ticket: {
            poolId: pool.id,
            deletedAt: null,
          },
        },
        _sum: { hours: true },
      });

      const usedHours = usedHoursResult._sum.hours || 0;

      return {
        ...pool,
        usedHours,
        remainingHours: pool.totalHours - usedHours,
        usedPercentage: Math.round((usedHours / pool.totalHours) * 100),
      };
    })
  );

  return poolsWithHours;
}

export async function getSupportPoolById(id: string) {
  await requirePermission("supportPools", "read");

  const pool = await prisma.supportPool.findUnique({
    where: { id, deletedAt: null },
    include: {
      client: true,
      project: true,
      assignments: {
        where: { active: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: { select: { code: true, name: true } },
            },
          },
        },
      },
      flows: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
      tickets: {
        where: { deletedAt: null },
        include: {
          flow: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: {
            select: { comments: true, timeEntries: true },
          },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!pool) return null;

  // Calcular horas usadas
  const usedHoursResult = await prisma.ticketTimeEntry.aggregate({
    where: {
      ticket: {
        poolId: pool.id,
        deletedAt: null,
      },
    },
    _sum: { hours: true },
  });

  const usedHours = usedHoursResult._sum.hours || 0;

  return {
    ...pool,
    usedHours,
    remainingHours: pool.totalHours - usedHours,
    usedPercentage: Math.round((usedHours / pool.totalHours) * 100),
  };
}

// ==================== MUTATIONS ====================

export async function createSupportPool(input: CreateSupportPoolInput) {
  await requirePermission("supportPools", "create");

  // Verificar que el PEP no exista
  const existingPep = await prisma.supportPool.findUnique({
    where: { pep: input.pep },
  });

  if (existingPep) {
    throw new Error(`Ya existe una bolsa de soporte con el PEP ${input.pep}`);
  }

  const pool = await prisma.supportPool.create({
    data: {
      name: input.name,
      description: input.description,
      pep: input.pep,
      totalHours: input.totalHours,
      autoAcceptThreshold: input.autoAcceptThreshold,
      clientId: input.clientId,
      projectId: input.projectId,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });

  await logCreate("SupportPool", pool.id, pool);
  revalidatePath("/dashboard/soporte");

  return pool;
}

export async function updateSupportPool(id: string, input: UpdateSupportPoolInput) {
  await requirePermission("supportPools", "update");

  const existing = await prisma.supportPool.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Bolsa de soporte no encontrada");
  }

  // Si cambia el PEP, verificar que no exista
  if (input.pep && input.pep !== existing.pep) {
    const existingPep = await prisma.supportPool.findUnique({
      where: { pep: input.pep },
    });

    if (existingPep) {
      throw new Error(`Ya existe una bolsa de soporte con el PEP ${input.pep}`);
    }
  }

  const pool = await prisma.supportPool.update({
    where: { id },
    data: input,
  });

  await logUpdate("SupportPool", id, existing, pool);
  revalidatePath("/dashboard/soporte");
  revalidatePath(`/dashboard/soporte/${id}`);

  return pool;
}

export async function deleteSupportPool(id: string) {
  const session = await requirePermission("supportPools", "delete");

  // Contar solo tickets EN PROGRESO (no finalizados)
  const activeTicketsCount = await prisma.supportTicket.count({
    where: {
      poolId: id,
      deletedAt: null,
      stage: {
        notIn: ["ATENDIDO", "CANCELADO"], // Estados finales no bloquean
      },
    },
  });

  const existing = await prisma.supportPool.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Bolsa de soporte no encontrada");
  }

  // No permitir eliminar si tiene tickets activos (en progreso)
  if (activeTicketsCount > 0) {
    throw new Error(
      `No se puede eliminar una bolsa con ${activeTicketsCount} ticket(s) en progreso. Primero atendelos o cancelalos.`
    );
  }

  // Soft delete
  await prisma.supportPool.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  await logSoftDelete("SupportPool", id, existing);
  revalidatePath("/dashboard/soporte");
}

export async function restoreSupportPool(id: string) {
  await requirePermission("supportPools", "update");

  await prisma.supportPool.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });

  await logRestore("SupportPool", id);
  revalidatePath("/dashboard/soporte");
}

// ==================== ASSIGNMENTS ====================

export async function assignUserToPool(poolId: string, userId: string) {
  await requirePermission("supportPools", "update");

  // Verificar que no exista ya la asignación
  const existing = await prisma.supportPoolAssignment.findUnique({
    where: {
      poolId_userId: { poolId, userId },
    },
  });

  if (existing) {
    if (existing.active) {
      throw new Error("El usuario ya está asignado a esta bolsa");
    }

    // Reactivar asignación existente
    await prisma.supportPoolAssignment.update({
      where: { id: existing.id },
      data: { active: true },
    });
  } else {
    await prisma.supportPoolAssignment.create({
      data: { poolId, userId },
    });
  }

  // Obtener datos para notificación
  const pool = await prisma.supportPool.findUnique({
    where: { id: poolId },
    select: { name: true },
  });

  if (pool) {
    await notifySupportPoolAssignment(userId, pool.name);
  }

  revalidatePath(`/dashboard/soporte/${poolId}`);
}

export async function removeUserFromPool(poolId: string, userId: string) {
  await requirePermission("supportPools", "update");

  const assignment = await prisma.supportPoolAssignment.findUnique({
    where: {
      poolId_userId: { poolId, userId },
    },
  });

  if (!assignment) {
    throw new Error("Asignación no encontrada");
  }

  await prisma.supportPoolAssignment.update({
    where: { id: assignment.id },
    data: { active: false },
  });

  revalidatePath(`/dashboard/soporte/${poolId}`);
}

// ==================== DATA FOR SELECTS ====================

export async function getClientsForSelect() {
  await requireAuth();

  return prisma.client.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getProjectsForSelect(clientId?: string) {
  await requireAuth();

  return prisma.project.findMany({
    where: {
      deletedAt: null,
      ...(clientId ? { clientId } : {}),
    },
    select: { id: true, name: true, clientId: true },
    orderBy: { name: "asc" },
  });
}

export async function getUsersForSelect() {
  await requireAuth();

  return prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { code: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}
