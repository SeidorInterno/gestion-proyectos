import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Obtener proyecto y usuario
  const project = await prisma.project.findFirst();
  const user = await prisma.user.findFirst();

  if (!project || !user) {
    console.log("No hay proyecto o usuario");
    return;
  }

  console.log("Proyecto:", project.id, project.name);
  console.log("Usuario:", user.id, user.name);

  // Crear blocker con 5 días de impacto
  const blocker = await prisma.projectEvent.create({
    data: {
      projectId: project.id,
      category: "BLOCKER",
      type: "tecnico",
      title: "Error crítico en servidor de desarrollo",
      description:
        "El servidor de desarrollo está caído y no permite avanzar con las pruebas",
      priority: "CRITICO",
      status: "ABIERTO",
      impactDays: 5,
      impactCost: 2500,
      reportedById: user.id,
      assignedToId: user.id,
    },
  });

  console.log("\n✅ Blocker creado exitosamente:");
  console.log("   ID:", blocker.id);
  console.log("   Título:", blocker.title);
  console.log("   Días de impacto:", blocker.impactDays);
  console.log("   Estado:", blocker.status);
  console.log("\n📌 Ahora revisa el cronograma del proyecto para ver la barra roja de bloqueo");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
