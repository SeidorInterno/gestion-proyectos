"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole } from "@/lib/auth-utils";
import { logCreate, logUpdate, logSoftDelete } from "@/lib/audit";

// Schema para contacto
const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del contacto es requerido"),
  position: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

// Schema para cliente con contactos
const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  ruc: z.string().regex(/^\d{11}$/, "El RUC debe tener exactamente 11 dígitos").optional().or(z.literal("")),
  country: z.string().optional(),
  address: z.string().optional(),
  contacts: z.array(contactSchema).min(1, "Debe agregar al menos un contacto"),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ClientInput = z.infer<typeof clientSchema>;

export async function createClient(data: ClientInput) {
  // Solo MANAGER y ARQUITECTO_RPA pueden crear clientes
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const validated = clientSchema.parse(data);

  // Asegurar que el primer contacto sea principal
  const contactsWithPrimary = validated.contacts.map((contact, index) => ({
    ...contact,
    isPrimary: index === 0,
    email: contact.email || null,
    position: contact.position || null,
    phone: contact.phone || null,
  }));

  const client = await prisma.client.create({
    data: {
      name: validated.name,
      ruc: validated.ruc || null,
      country: validated.country || null,
      address: validated.address || null,
      contacts: {
        create: contactsWithPrimary,
      },
    },
    include: {
      contacts: true,
    },
  });

  // Audit log
  await logCreate("Client", client.id, {
    name: client.name,
    ruc: client.ruc,
    country: client.country,
    address: client.address,
    contactsCount: client.contacts.length,
  });

  revalidatePath("/dashboard/clientes");
  return client;
}

export async function updateClient(id: string, data: ClientInput) {
  // Solo MANAGER y ARQUITECTO_RPA pueden editar clientes
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const validated = clientSchema.parse(data);

  // Obtener cliente actual para audit log
  const oldClient = await prisma.client.findUnique({
    where: { id },
    include: { contacts: { where: { active: true } } },
  });

  // Obtener contactos existentes
  const existingContacts = await prisma.contact.findMany({
    where: { clientId: id, active: true },
  });

  const existingIds = existingContacts.map((c) => c.id);
  const newContactIds = validated.contacts
    .filter((c) => c.id)
    .map((c) => c.id as string);

  // Contactos a eliminar (soft delete)
  const toDelete = existingIds.filter((id) => !newContactIds.includes(id));

  // Contactos a actualizar
  const toUpdate = validated.contacts.filter((c) => c.id && existingIds.includes(c.id));

  // Contactos a crear
  const toCreate = validated.contacts.filter((c) => !c.id);

  // Asegurar que el primero sea principal
  const allContacts = [...toUpdate, ...toCreate];

  await prisma.$transaction(async (tx) => {
    // Actualizar cliente
    await tx.client.update({
      where: { id },
      data: {
        name: validated.name,
        ruc: validated.ruc || null,
        country: validated.country || null,
        address: validated.address || null,
      },
    });

    // Soft delete contactos removidos
    if (toDelete.length > 0) {
      await tx.contact.updateMany({
        where: { id: { in: toDelete } },
        data: { active: false },
      });
    }

    // Resetear isPrimary de todos los contactos existentes
    await tx.contact.updateMany({
      where: { clientId: id },
      data: { isPrimary: false },
    });

    // Actualizar contactos existentes
    for (let i = 0; i < toUpdate.length; i++) {
      const contact = toUpdate[i];
      await tx.contact.update({
        where: { id: contact.id },
        data: {
          name: contact.name,
          position: contact.position || null,
          email: contact.email || null,
          phone: contact.phone || null,
          isPrimary: i === 0 && toCreate.length === 0,
        },
      });
    }

    // Crear nuevos contactos
    for (let i = 0; i < toCreate.length; i++) {
      const contact = toCreate[i];
      await tx.contact.create({
        data: {
          clientId: id,
          name: contact.name,
          position: contact.position || null,
          email: contact.email || null,
          phone: contact.phone || null,
          isPrimary: i === 0 && toUpdate.length === 0,
        },
      });
    }

    // Si hay contactos, asegurar que el primero sea principal
    const firstContact = await tx.contact.findFirst({
      where: { clientId: id, active: true },
      orderBy: { createdAt: "asc" },
    });

    if (firstContact) {
      await tx.contact.update({
        where: { id: firstContact.id },
        data: { isPrimary: true },
      });
    }
  });

  revalidatePath("/dashboard/clientes");

  const updatedClient = await prisma.client.findUnique({
    where: { id },
    include: { contacts: { where: { active: true } } },
  });

  // Audit log
  if (oldClient && updatedClient) {
    await logUpdate("Client", id,
      { name: oldClient.name, ruc: oldClient.ruc, country: oldClient.country, address: oldClient.address, contactsCount: oldClient.contacts.length },
      { name: updatedClient.name, ruc: updatedClient.ruc, country: updatedClient.country, address: updatedClient.address, contactsCount: updatedClient.contacts.length }
    );
  }

  return updatedClient;
}

export async function deleteClient(id: string) {
  // Solo MANAGER puede eliminar clientes
  await requireRole(["MANAGER"]);

  // Obtener cliente para audit log
  const client = await prisma.client.findUnique({
    where: { id },
    include: { contacts: { where: { active: true } } },
  });

  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  // Verificar si tiene proyectos activos
  const projectCount = await prisma.project.count({
    where: { clientId: id, deletedAt: null },
  });

  if (projectCount > 0) {
    throw new Error("No se puede eliminar un cliente con proyectos asociados");
  }

  await prisma.client.update({
    where: { id },
    data: { active: false },
  });

  // Audit log
  await logSoftDelete("Client", id, {
    name: client.name,
    ruc: client.ruc,
    country: client.country,
    address: client.address,
    contactsCount: client.contacts.length,
  });

  revalidatePath("/dashboard/clientes");
}

export async function getClients() {
  return prisma.client.findMany({
    where: { active: true },
    include: {
      contacts: {
        where: { active: true },
        orderBy: { isPrimary: "desc" },
      },
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      contacts: {
        where: { active: true },
        orderBy: { isPrimary: "desc" },
      },
    },
  });
}

// Acciones individuales para contactos
export async function addContact(
  clientId: string,
  data: Omit<ContactInput, "id">
) {
  // Solo MANAGER y ARQUITECTO_RPA pueden agregar contactos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const contact = await prisma.contact.create({
    data: {
      clientId,
      name: data.name,
      position: data.position || null,
      email: data.email || null,
      phone: data.phone || null,
      isPrimary: false,
    },
  });

  revalidatePath("/dashboard/clientes");
  return contact;
}

export async function updateContact(id: string, data: Omit<ContactInput, "id">) {
  // Solo MANAGER y ARQUITECTO_RPA pueden actualizar contactos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name,
      position: data.position || null,
      email: data.email || null,
      phone: data.phone || null,
    },
  });

  revalidatePath("/dashboard/clientes");
  return contact;
}

export async function deleteContact(id: string) {
  // Solo MANAGER y ARQUITECTO_RPA pueden eliminar contactos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  // Verificar que no sea el único contacto
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          contacts: {
            where: { active: true },
          },
        },
      },
    },
  });

  if (!contact) {
    throw new Error("Contacto no encontrado");
  }

  if (contact.client.contacts.length <= 1) {
    throw new Error("No se puede eliminar el único contacto del cliente");
  }

  // Soft delete
  await prisma.contact.update({
    where: { id },
    data: { active: false },
  });

  // Si era el principal, hacer principal al siguiente
  if (contact.isPrimary) {
    const nextContact = await prisma.contact.findFirst({
      where: {
        clientId: contact.clientId,
        active: true,
        id: { not: id },
      },
    });

    if (nextContact) {
      await prisma.contact.update({
        where: { id: nextContact.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath("/dashboard/clientes");
}

export async function setPrimaryContact(id: string) {
  // Solo MANAGER y ARQUITECTO_RPA pueden cambiar el contacto principal
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw new Error("Contacto no encontrado");
  }

  await prisma.$transaction([
    // Quitar principal de todos
    prisma.contact.updateMany({
      where: { clientId: contact.clientId },
      data: { isPrimary: false },
    }),
    // Establecer nuevo principal
    prisma.contact.update({
      where: { id },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath("/dashboard/clientes");
}
