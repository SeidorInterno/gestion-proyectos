"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth-utils";
import { logCreate, logUpdate, logSoftDelete } from "@/lib/audit";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleId: z.string().min(1, "El rol es requerido"),
  consultorLevelId: z.string().optional().nullable(),
});

export type UserInput = z.infer<typeof userSchema>;

export async function createUser(data: UserInput) {
  // Solo MANAGER puede crear usuarios
  await requireRole(["MANAGER"]);

  const validated = userSchema.parse(data);

  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new Error("Ya existe un usuario con este email");
  }

  // Verificar que el rol existe
  const role = await prisma.role.findUnique({
    where: { id: validated.roleId },
  });

  if (!role) {
    throw new Error("Rol no encontrado");
  }

  // Si el rol tiene niveles, verificar que se proporcionó un nivel
  if (role.hasLevels && !validated.consultorLevelId) {
    throw new Error("Se requiere un nivel para este rol");
  }

  // Hash de la contraseña (bcrypt con factor 12 para mayor seguridad)
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      roleId: validated.roleId,
      consultorLevelId: role.hasLevels ? validated.consultorLevelId : null,
    },
    include: {
      role: true,
      consultorLevel: true,
    },
  });

  // Audit log (sin incluir password)
  await logCreate("User", user.id, {
    name: user.name,
    email: user.email,
    role: user.role.name,
    consultorLevel: user.consultorLevel?.name,
  });

  revalidatePath("/dashboard/usuarios");
  return { ...user, password: undefined };
}

export async function updateUser(
  id: string,
  data: Omit<UserInput, "password"> & { password?: string }
) {
  // Solo MANAGER puede editar usuarios
  await requireRole(["MANAGER"]);

  const validated = userSchema.partial().parse(data);

  // Obtener usuario actual para audit log
  const oldUser = await prisma.user.findUnique({
    where: { id },
    include: { role: true, consultorLevel: true },
  });

  // Verificar si el email ya existe en otro usuario
  if (validated.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validated.email,
        id: { not: id },
      },
    });

    if (existingUser) {
      throw new Error("Ya existe un usuario con este email");
    }
  }

  // Verificar que el rol existe si se proporcionó
  let role = null;
  if (validated.roleId) {
    role = await prisma.role.findUnique({
      where: { id: validated.roleId },
    });

    if (!role) {
      throw new Error("Rol no encontrado");
    }
  }

  const updateData: Record<string, unknown> = {
    name: validated.name,
    email: validated.email,
    roleId: validated.roleId,
    consultorLevelId: role?.hasLevels ? validated.consultorLevelId : null,
  };

  // Solo actualizar contraseña si se proporciona una nueva (mínimo 8 caracteres)
  if (validated.password && validated.password.length >= 8) {
    updateData.password = await bcrypt.hash(validated.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true, consultorLevel: true },
  });

  // Audit log (sin incluir password)
  if (oldUser) {
    await logUpdate("User", id,
      { name: oldUser.name, email: oldUser.email, role: oldUser.role.name, consultorLevel: oldUser.consultorLevel?.name },
      { name: user.name, email: user.email, role: user.role.name, consultorLevel: user.consultorLevel?.name }
    );
  }

  revalidatePath("/dashboard/usuarios");
  return { ...user, password: undefined };
}

export async function toggleUserActive(id: string) {
  // Solo MANAGER puede activar/desactivar usuarios
  await requireRole(["MANAGER"]);

  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const newActiveState = !user.active;

  await prisma.user.update({
    where: { id },
    data: { active: newActiveState },
  });

  // Audit log
  await logUpdate("User", id,
    { name: user.name, email: user.email, active: user.active },
    { name: user.name, email: user.email, active: newActiveState }
  );

  revalidatePath("/dashboard/usuarios");
}

export async function deleteUser(id: string) {
  // Solo MANAGER puede eliminar usuarios
  await requireRole(["MANAGER"]);

  // Obtener usuario para audit log
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Verificar si tiene proyectos como manager activos
  const projectCount = await prisma.project.count({
    where: { managerId: id, deletedAt: null },
  });

  if (projectCount > 0) {
    throw new Error("No se puede eliminar un usuario que es manager de proyectos activos");
  }

  // Verificar asignaciones activas
  const assignmentCount = await prisma.projectAssignment.count({
    where: { userId: id, active: true },
  });

  if (assignmentCount > 0) {
    throw new Error("No se puede eliminar un usuario con asignaciones activas");
  }

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  // Audit log
  await logSoftDelete("User", id, {
    name: user.name,
    email: user.email,
    role: user.role.name,
  });

  revalidatePath("/dashboard/usuarios");
}

export async function getUsers() {
  // Solo MANAGER puede ver lista de usuarios
  await requireRole(["MANAGER"]);

  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: true,
      consultorLevel: true,
      _count: {
        select: {
          projectsAsManager: true,
          assignments: true,
        },
      },
    },
  });
}

export async function getUserById(id: string) {
  // Solo MANAGER puede ver detalles de usuario
  await requireRole(["MANAGER"]);

  return prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      consultorLevel: true,
    },
  });
}

export async function getRoles() {
  // Solo MANAGER puede ver roles
  await requireRole(["MANAGER"]);

  return prisma.role.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
}

export async function getConsultorLevels() {
  // Solo MANAGER puede ver niveles
  await requireRole(["MANAGER"]);

  return prisma.consultorLevel.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
}
