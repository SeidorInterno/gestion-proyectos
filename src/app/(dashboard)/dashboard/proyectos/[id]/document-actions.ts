"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { z } from "zod";
import { logCreate, logSoftDelete } from "@/lib/audit";

const documentSchema = z.object({
  projectId: z.string().min(1, "El proyecto es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["PDD", "DSD", "MANUAL", "ACTA", "REQUERIMIENTO", "OTRO"]),
  url: z.string().url("URL inválida"),
  version: z.string().optional(),
  description: z.string().optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

export async function createDocument(data: DocumentInput) {
  // Solo MANAGER, ARQUITECTO_RPA y ANALISTA_FUNCIONAL pueden crear documentos
  const session = await requireRole(["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"]);

  const validated = documentSchema.parse(data);

  const document = await prisma.projectDocument.create({
    data: {
      name: validated.name,
      type: validated.type as any,
      url: validated.url,
      version: validated.version || null,
      description: validated.description || null,
      projectId: validated.projectId,
      uploadedById: session.user.id!,
    },
  });

  // Audit log
  await logCreate("ProjectDocument", document.id, {
    name: document.name,
    type: document.type,
    url: document.url,
    projectId: document.projectId,
  });

  revalidatePath(`/dashboard/proyectos/${validated.projectId}`);
  return document;
}

export async function deleteDocument(documentId: string) {
  // Solo MANAGER y ARQUITECTO_RPA pueden eliminar documentos
  await requireRole(["MANAGER", "ARQUITECTO_RPA"]);

  const document = await prisma.projectDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Documento no encontrado");
  }

  await prisma.projectDocument.delete({
    where: { id: documentId },
  });

  // Audit log
  await logSoftDelete("ProjectDocument", documentId, {
    name: document.name,
    type: document.type,
    projectId: document.projectId,
  });

  revalidatePath(`/dashboard/proyectos/${document.projectId}`);
}

export async function getProjectDocuments(projectId: string) {
  return prisma.projectDocument.findMany({
    where: { projectId },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
