import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "SOFT_DELETE" | "RESTORE";
export type AuditEntity = "Project" | "Activity" | "Event" | "User" | "Client" | "Assignment" | "Phase";

interface CreateAuditLogParams {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an audit log entry for tracking changes in the system
 */
export async function createAuditLog({
  action,
  entity,
  entityId,
  oldData,
  newData,
  metadata,
}: CreateAuditLogParams): Promise<void> {
  try {
    const session = await auth();

    if (!session?.user) {
      console.warn("Audit log created without user session");
      return;
    }

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId: session.user.id,
        userName: session.user.name || "Unknown",
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break main operations
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Creates an audit log for entity creation
 */
export async function logCreate(
  entity: AuditEntity,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action: "CREATE",
    entity,
    entityId,
    newData: sanitizeForAudit(data),
  });
}

/**
 * Creates an audit log for entity update
 */
export async function logUpdate(
  entity: AuditEntity,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Promise<void> {
  const changes = getChangedFields(oldData, newData);

  if (Object.keys(changes.old).length === 0) {
    return; // No changes to log
  }

  await createAuditLog({
    action: "UPDATE",
    entity,
    entityId,
    oldData: changes.old,
    newData: changes.new,
  });
}

/**
 * Creates an audit log for soft delete
 */
export async function logSoftDelete(
  entity: AuditEntity,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action: "SOFT_DELETE",
    entity,
    entityId,
    oldData: sanitizeForAudit(data),
  });
}

/**
 * Creates an audit log for restore from soft delete
 */
export async function logRestore(
  entity: AuditEntity,
  entityId: string
): Promise<void> {
  await createAuditLog({
    action: "RESTORE",
    entity,
    entityId,
  });
}

/**
 * Creates an audit log for status change
 */
export async function logStatusChange(
  entity: AuditEntity,
  entityId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await createAuditLog({
    action: "STATUS_CHANGE",
    entity,
    entityId,
    oldData: { status: oldStatus },
    newData: { status: newStatus },
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(
  entity: AuditEntity,
  entityId: string,
  limit = 50
) {
  return prisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Sanitize data for audit log (remove sensitive fields)
 */
function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "apiKey"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === "object" && value !== null) {
      // Skip nested objects to keep logs manageable
      continue;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get only the fields that changed between old and new data
 */
function getChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): { old: Record<string, unknown>; new: Record<string, unknown> } {
  const changes = { old: {} as Record<string, unknown>, new: {} as Record<string, unknown> };

  const sanitizedOld = sanitizeForAudit(oldData);
  const sanitizedNew = sanitizeForAudit(newData);

  for (const key of Object.keys(sanitizedNew)) {
    const oldValue = sanitizedOld[key];
    const newValue = sanitizedNew[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.old[key] = oldValue;
      changes.new[key] = newValue;
    }
  }

  return changes;
}
