import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Crear Roles
  const roles = [
    {
      code: "MANAGER",
      name: "Manager",
      description: "CEO, acceso total al sistema",
      hasLevels: false,
      order: 1,
    },
    {
      code: "ARQUITECTO_RPA",
      name: "Arquitecto RPA",
      description: "Líder de proyectos RPA",
      hasLevels: false,
      order: 2,
    },
    {
      code: "ANALISTA_FUNCIONAL",
      name: "Analista Funcional",
      description: "Análisis de procesos",
      hasLevels: false,
      order: 3,
    },
    {
      code: "CONSULTOR",
      name: "Consultor",
      description: "Desarrollador RPA",
      hasLevels: true,
      order: 4,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }
  console.log("Roles created");

  // Crear Niveles de Consultor
  const levels = [
    {
      code: "N1",
      name: "N1 - Junior",
      description: "Consultor nivel inicial",
      order: 1,
    },
    {
      code: "N2",
      name: "N2 - Semi-senior",
      description: "Consultor con experiencia",
      order: 2,
    },
    {
      code: "N3",
      name: "N3 - Senior",
      description: "Consultor experto",
      order: 3,
    },
  ];

  for (const level of levels) {
    await prisma.consultorLevel.upsert({
      where: { code: level.code },
      update: level,
      create: level,
    });
  }
  console.log("Consultor levels created");

  // Obtener el rol de Manager para el admin
  const managerRole = await prisma.role.findUnique({
    where: { code: "MANAGER" },
  });

  if (!managerRole) {
    throw new Error("Manager role not found");
  }

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@seidor.com" },
    update: {},
    create: {
      email: "admin@seidor.com",
      name: "Administrador Seidor",
      password: hashedPassword,
      roleId: managerRole.id,
    },
  });
  console.log("Admin user created");

  // Crear feriados de Peru 2025
  const holidays2025 = [
    { name: "Año Nuevo", date: new Date(2025, 0, 1) },
    { name: "Dia del Trabajo", date: new Date(2025, 4, 1) },
    { name: "San Pedro y San Pablo", date: new Date(2025, 5, 29) },
    { name: "Fiestas Patrias", date: new Date(2025, 6, 28) },
    { name: "Fiestas Patrias", date: new Date(2025, 6, 29) },
    { name: "Santa Rosa de Lima", date: new Date(2025, 7, 30) },
    { name: "Combate de Angamos", date: new Date(2025, 9, 8) },
    { name: "Dia de Todos los Santos", date: new Date(2025, 10, 1) },
    { name: "Inmaculada Concepcion", date: new Date(2025, 11, 8) },
    { name: "Batalla de Ayacucho", date: new Date(2025, 11, 9) },
    { name: "Navidad", date: new Date(2025, 11, 25) },
  ];

  for (const h of holidays2025) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: {},
      create: {
        name: h.name,
        date: h.date,
        year: 2025,
        recurring: true,
      },
    });
  }
  console.log("Holidays created");

  console.log("");
  console.log("Seeding completed!");
  console.log("");
  console.log("Credenciales de prueba:");
  console.log("  Email: admin@seidor.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
