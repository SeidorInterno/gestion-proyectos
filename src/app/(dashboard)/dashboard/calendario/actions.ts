"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPeruHolidays } from "@/lib/date-utils";
import { requireRole } from "@/lib/auth-utils";

export async function createHoliday(data: { name: string; date: Date }) {
  // Solo MANAGER puede crear feriados
  await requireRole(["MANAGER"]);

  const year = data.date.getFullYear();

  const holiday = await prisma.holiday.create({
    data: {
      name: data.name,
      date: data.date,
      year,
      recurring: false,
    },
  });

  revalidatePath("/dashboard/calendario");
  return holiday;
}

export async function deleteHoliday(id: string) {
  // Solo MANAGER puede eliminar feriados
  await requireRole(["MANAGER"]);

  await prisma.holiday.delete({
    where: { id },
  });

  revalidatePath("/dashboard/calendario");
}

export async function importPeruHolidays(year: number) {
  // Solo MANAGER puede importar feriados
  await requireRole(["MANAGER"]);

  const peruHolidays = getPeruHolidays(year);

  for (const holiday of peruHolidays) {
    // Verificar si ya existe
    const existing = await prisma.holiday.findFirst({
      where: {
        date: holiday.date,
      },
    });

    if (!existing) {
      await prisma.holiday.create({
        data: {
          name: holiday.name,
          date: holiday.date,
          year,
          recurring: true,
        },
      });
    }
  }

  revalidatePath("/dashboard/calendario");
}
