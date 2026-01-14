import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Obtener el blocker activo con días de impacto
  const blocker = await prisma.projectEvent.findFirst({
    where: {
      category: "BLOCKER",
      status: "ABIERTO",
      impactDays: { not: null },
    },
    include: {
      project: true,
    },
  });

  if (!blocker) {
    console.log("No hay blocker activo para resolver");
    return;
  }

  console.log("📋 Blocker encontrado:");
  console.log("   ID:", blocker.id);
  console.log("   Título:", blocker.title);
  console.log("   Proyecto:", blocker.project.name);
  console.log("   Días de impacto:", blocker.impactDays);

  // Mostrar actividades antes de recalcular
  const activitiesBefore = await prisma.activity.findMany({
    where: {
      phase: { projectId: blocker.projectId },
      status: { in: ["PENDIENTE", "EN_PROGRESO"] },
    },
    select: {
      code: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    take: 5,
  });

  console.log("\n📅 Actividades ANTES de recalcular (primeras 5):");
  activitiesBefore.forEach((a) => {
    console.log(
      `   ${a.code}: ${a.startDate?.toLocaleDateString()} - ${a.endDate?.toLocaleDateString()}`
    );
  });

  // Resolver el blocker
  const resolvedBlocker = await prisma.projectEvent.update({
    where: { id: blocker.id },
    data: {
      status: "RESUELTO",
      endDate: new Date(),
    },
  });

  console.log("\n✅ Blocker resuelto:", resolvedBlocker.status);

  // Ahora recalcular fechas
  const daysToAdd = blocker.impactDays || 0;
  if (daysToAdd > 0) {
    console.log(`\n🔄 Recalculando fechas (+${daysToAdd} días)...`);

    const activities = await prisma.activity.findMany({
      where: {
        phase: { projectId: blocker.projectId },
        status: { in: ["PENDIENTE", "EN_PROGRESO"] },
      },
    });

    const updates = activities.map((activity) => {
      const newStartDate = activity.startDate
        ? new Date(activity.startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        : null;
      const newEndDate = activity.endDate
        ? new Date(activity.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        : null;

      return prisma.activity.update({
        where: { id: activity.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      });
    });

    await Promise.all(updates);

    // También actualizar fecha fin del proyecto
    const project = await prisma.project.findUnique({
      where: { id: blocker.projectId },
    });

    if (project?.endDate) {
      await prisma.project.update({
        where: { id: blocker.projectId },
        data: {
          endDate: new Date(project.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`   ✅ Se actualizaron ${activities.length} actividades`);

    // Mostrar actividades después de recalcular
    const activitiesAfter = await prisma.activity.findMany({
      where: {
        phase: { projectId: blocker.projectId },
        status: { in: ["PENDIENTE", "EN_PROGRESO"] },
      },
      select: {
        code: true,
        name: true,
        startDate: true,
        endDate: true,
      },
      take: 5,
    });

    console.log("\n📅 Actividades DESPUÉS de recalcular (primeras 5):");
    activitiesAfter.forEach((a) => {
      console.log(
        `   ${a.code}: ${a.startDate?.toLocaleDateString()} - ${a.endDate?.toLocaleDateString()}`
      );
    });
  }

  console.log("\n🎉 Proceso completado. Refresca el navegador para ver los cambios.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
