import { prisma } from "@/lib/prisma";

type NotificationType =
  | "PROJECT_ASSIGNED"
  | "PROJECT_STATUS_CHANGE"
  | "BLOCKER_CREATED"
  | "BLOCKER_RESOLVED"
  | "EVENT_ASSIGNED"
  | "ACTIVITY_COMPLETED"
  | "PROJECT_PAUSED"
  | "PROJECT_RESUMED";

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
}

export async function createNotification({
  type,
  title,
  message,
  userId,
}: CreateNotificationParams) {
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
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function notifyProjectAssignment(
  userId: string,
  projectName: string,
  role: string
) {
  return createNotification({
    type: "PROJECT_ASSIGNED",
    title: "Nuevo proyecto asignado",
    message: `Has sido asignado al proyecto "${projectName}" como ${role}.`,
    userId,
  });
}

export async function notifyBlockerCreated(
  assignedToId: string,
  blockerTitle: string,
  projectName: string
) {
  return createNotification({
    type: "BLOCKER_CREATED",
    title: "Nuevo blocker reportado",
    message: `Se ha reportado un blocker "${blockerTitle}" en el proyecto "${projectName}".`,
    userId: assignedToId,
  });
}

export async function notifyBlockerResolved(
  reportedById: string,
  blockerTitle: string,
  projectName: string
) {
  return createNotification({
    type: "BLOCKER_RESOLVED",
    title: "Blocker resuelto",
    message: `El blocker "${blockerTitle}" en el proyecto "${projectName}" ha sido resuelto.`,
    userId: reportedById,
  });
}

export async function notifyProjectStatusChange(
  userIds: string[],
  projectName: string,
  newStatus: string
) {
  const statusLabels: Record<string, string> = {
    EN_PROGRESO: "En Progreso",
    PAUSADO: "Pausado",
    COMPLETADO: "Completado",
    CANCELADO: "Cancelado",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  await Promise.all(
    userIds.map((userId) =>
      createNotification({
        type: newStatus === "PAUSADO" ? "PROJECT_PAUSED" : "PROJECT_STATUS_CHANGE",
        title: newStatus === "PAUSADO" ? "Proyecto pausado" : "Estado de proyecto actualizado",
        message: `El proyecto "${projectName}" ha cambiado a estado "${statusLabel}".`,
        userId,
      })
    )
  );
}

export async function notifyTeamMembers(
  projectId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  // Get all team members assigned to the project
  const assignments = await prisma.projectAssignment.findMany({
    where: { projectId, active: true },
    select: { userId: true },
  });

  // Get the project manager
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { managerId: true },
  });

  const userIds = new Set(assignments.map((a) => a.userId));
  if (project?.managerId) {
    userIds.add(project.managerId);
  }

  await Promise.all(
    Array.from(userIds).map((userId) =>
      createNotification({ type, title, message, userId })
    )
  );
}
