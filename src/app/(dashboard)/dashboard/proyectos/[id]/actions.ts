"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole, requireAuth } from "@/lib/auth-utils";

const assignmentSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  allocationPercentage: z.number().min(1).max(100).default(100),
  hoursPerDay: z.number().min(0.5).max(24).default(8),
});

export async function addResourceToProject(data: {
  projectId: string;
  userId: string;
  allocationPercentage?: number;
  hoursPerDay?: number;
}) {
  // Solo MANAGER y ARQUITECTO_RPA pueden asignar recursos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const validated = assignmentSchema.parse(data);

  // Check if assignment already exists
  const existing = await prisma.projectAssignment.findUnique({
    where: {
      projectId_userId: {
        projectId: validated.projectId,
        userId: validated.userId,
      },
    },
  });

  if (existing) {
    throw new Error("Este recurso ya está asignado al proyecto");
  }

  const assignment = await prisma.projectAssignment.create({
    data: {
      projectId: validated.projectId,
      userId: validated.userId,
      allocationPercentage: validated.allocationPercentage,
      hoursPerDay: validated.hoursPerDay,
      active: true,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  revalidatePath(`/dashboard/proyectos/${validated.projectId}`);
  return assignment;
}

export async function removeResourceFromProject(assignmentId: string, projectId: string) {
  // Solo MANAGER y ARQUITECTO_RPA pueden remover recursos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  await prisma.projectAssignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath(`/dashboard/proyectos/${projectId}`);
}

export async function getAvailableResources(projectId: string) {
  // Requiere autenticación para consultar recursos disponibles
  await requireAuth();

  // Get users that are not already assigned to this project
  const assignedUserIds = await prisma.projectAssignment.findMany({
    where: { projectId, active: true },
    select: { userId: true },
  });

  const assignedIds = assignedUserIds.map((a) => a.userId);

  const availableUsers = await prisma.user.findMany({
    where: {
      active: true,
      id: { notIn: assignedIds },
    },
    include: {
      role: true,
      consultorLevel: true,
    },
    orderBy: { name: "asc" },
  });

  return availableUsers;
}
