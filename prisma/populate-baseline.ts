import { PrismaClient } from "@prisma/client";
import { differenceInDays } from "date-fns";

const prisma = new PrismaClient();

// Función para obtener el código padre de un SubItem
function getParentCode(code: string): string | null {
  const parts = code.split(".");
  if (parts.length <= 2) return null;
  return parts.slice(0, 2).join(".");
}

// Función para verificar si es un Item (nivel 1)
function isItem(code: string): boolean {
  const parts = code.split(".");
  return parts.length === 2;
}

// Función para verificar si es un SubItem (nivel 2)
function isSubItem(code: string): boolean {
  const parts = code.split(".");
  return parts.length >= 3;
}

async function populateBaseline() {
  console.log("Iniciando población de baseline para proyectos existentes...\n");

  // 1. Obtener todos los proyectos con sus fases y actividades
  const projects = await prisma.project.findMany({
    include: {
      phases: {
        include: {
          activities: {
            orderBy: { code: "asc" },
          },
        },
      },
    },
  });

  console.log(`Encontrados ${projects.length} proyectos\n`);

  for (const project of projects) {
    console.log(`\n📁 Proyecto: ${project.name}`);

    let projectEndDate: Date | null = null;
    let totalActivities = 0;

    for (const phase of project.phases) {
      // Primero, calcular el rango de fechas para cada Item basado en sus SubItems
      const itemRanges: Record<string, { minStart: Date | null; maxEnd: Date | null }> = {};

      // Recolectar rangos de SubItems
      for (const activity of phase.activities) {
        if (isSubItem(activity.code)) {
          const parentCode = getParentCode(activity.code);
          if (parentCode) {
            if (!itemRanges[parentCode]) {
              itemRanges[parentCode] = { minStart: null, maxEnd: null };
            }
            if (activity.startDate) {
              if (!itemRanges[parentCode].minStart || activity.startDate < itemRanges[parentCode].minStart!) {
                itemRanges[parentCode].minStart = activity.startDate;
              }
            }
            if (activity.endDate) {
              if (!itemRanges[parentCode].maxEnd || activity.endDate > itemRanges[parentCode].maxEnd!) {
                itemRanges[parentCode].maxEnd = activity.endDate;
              }
            }
          }
        }
      }

      // Actualizar cada actividad
      for (const activity of phase.activities) {
        totalActivities++;

        let baselineStart = activity.startDate;
        let baselineEnd = activity.endDate;

        // Para Items con SubItems, usar el rango calculado de los SubItems
        if (isItem(activity.code) && itemRanges[activity.code]) {
          const range = itemRanges[activity.code];
          if (range.minStart) baselineStart = range.minStart;
          if (range.maxEnd) baselineEnd = range.maxEnd;
          console.log(`   📌 Item ${activity.code}: baseline ajustado a rango de SubItems`);
        }

        // Actualizar baseline de la actividad
        if (baselineStart || baselineEnd || activity.durationDays) {
          const duration = baselineStart && baselineEnd
            ? differenceInDays(baselineEnd, baselineStart) + 1
            : activity.durationDays;

          await prisma.activity.update({
            where: { id: activity.id },
            data: {
              baselineStartDate: baselineStart,
              baselineEndDate: baselineEnd,
              baselineDuration: duration,
              isLocked: true,
            },
          });

          // Encontrar la fecha más tardía para el proyecto
          if (baselineEnd) {
            if (!projectEndDate || baselineEnd > projectEndDate) {
              projectEndDate = baselineEnd;
            }
          }
        }
      }
    }

    console.log(`   ✓ ${totalActivities} actividades actualizadas con baseline`);

    // Actualizar baseline del proyecto
    if (project.startDate && projectEndDate) {
      const totalDays = differenceInDays(projectEndDate, project.startDate) + 1;

      await prisma.project.update({
        where: { id: project.id },
        data: {
          baselineStartDate: project.startDate,
          baselineEndDate: projectEndDate,
          baselineTotalDays: totalDays,
        },
      });

      console.log(`   ✓ Proyecto actualizado:`);
      console.log(`     - Baseline Start: ${project.startDate.toLocaleDateString()}`);
      console.log(`     - Baseline End: ${projectEndDate.toLocaleDateString()}`);
      console.log(`     - Total Days: ${totalDays}`);
    } else {
      console.log(`   ⚠ Proyecto sin fechas definidas, baseline no establecido`);
    }
  }

  console.log("\n✅ Población de baseline completada!\n");
}

populateBaseline()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
