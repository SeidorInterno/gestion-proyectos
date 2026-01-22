import { auth } from "@/lib/auth";

// Tipos de roles del sistema
export type RoleCode = "MANAGER" | "ARQUITECTO_RPA" | "ANALISTA_FUNCIONAL" | "CONSULTOR";

// Permisos por recurso
export const PERMISSIONS = {
  users: {
    create: ["MANAGER"],
    read: ["MANAGER"],
    update: ["MANAGER"],
    delete: ["MANAGER"],
  },
  clients: {
    create: ["MANAGER", "ARQUITECTO_RPA"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    update: ["MANAGER", "ARQUITECTO_RPA"],
    delete: ["MANAGER"],
  },
  projects: {
    create: ["MANAGER", "ARQUITECTO_RPA"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA"],
    delete: ["MANAGER"],
  },
  events: {
    create: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    delete: ["MANAGER", "ARQUITECTO_RPA"],
  },
  calendar: {
    create: ["MANAGER"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER"],
    delete: ["MANAGER"],
  },
  reports: {
    create: ["MANAGER", "ARQUITECTO_RPA"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    update: ["MANAGER"],
    delete: ["MANAGER"],
  },
  config: {
    create: ["MANAGER"],
    read: ["MANAGER"],
    update: ["MANAGER"],
    delete: ["MANAGER"],
  },
  supportPools: {
    create: ["MANAGER", "ARQUITECTO_RPA"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA"],
    delete: ["MANAGER"],
  },
  supportFlows: {
    create: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    delete: ["MANAGER", "ARQUITECTO_RPA"],
  },
  tickets: {
    create: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    delete: ["MANAGER", "ARQUITECTO_RPA"],
  },
  ticketComments: {
    create: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    delete: ["MANAGER", "ARQUITECTO_RPA"],
  },
  ticketTime: {
    create: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    read: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL", "CONSULTOR"],
    update: ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"],
    delete: ["MANAGER", "ARQUITECTO_RPA"],
  },
} as const;

export type Resource = keyof typeof PERMISSIONS;
export type Action = "create" | "read" | "update" | "delete";

/**
 * Verifica que el usuario esté autenticado
 * @throws Error si no hay sesión activa
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado. Debe iniciar sesión.");
  }
  return session;
}

/**
 * Verifica que el usuario tenga uno de los roles especificados
 * @param allowedRoles Lista de roles permitidos
 * @throws Error si el usuario no tiene el rol requerido
 */
export async function requireRole(allowedRoles: RoleCode[]) {
  const session = await requireAuth();
  const userRole = session.user.roleCode as RoleCode;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Sin permisos. Se requiere uno de los roles: ${allowedRoles.join(", ")}`);
  }

  return session;
}

/**
 * Verifica que el usuario tenga permiso para una acción en un recurso
 * @param resource Recurso a acceder
 * @param action Acción a realizar
 * @throws Error si no tiene permiso
 */
export async function requirePermission(resource: Resource, action: Action) {
  const session = await requireAuth();
  const userRole = session.user.roleCode as RoleCode;

  const allowedRoles = PERMISSIONS[resource][action] as readonly RoleCode[];

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Sin permisos para ${action} en ${resource}`);
  }

  return session;
}

/**
 * Verifica si el usuario tiene permiso (sin lanzar error)
 * @returns true si tiene permiso, false si no
 */
export async function hasPermission(resource: Resource, action: Action): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const userRole = session.user.roleCode as RoleCode;
    const allowedRoles = PERMISSIONS[resource][action] as readonly RoleCode[];

    return allowedRoles.includes(userRole);
  } catch {
    return false;
  }
}

/**
 * Obtiene el rol del usuario actual
 * @returns El código del rol o null si no hay sesión
 */
export async function getCurrentRole(): Promise<RoleCode | null> {
  try {
    const session = await auth();
    return (session?.user?.roleCode as RoleCode) || null;
  } catch {
    return null;
  }
}

/**
 * Verifica si el usuario es MANAGER
 */
export async function isManager(): Promise<boolean> {
  const role = await getCurrentRole();
  return role === "MANAGER";
}
