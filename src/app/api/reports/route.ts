import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type");
    const reportFormat = searchParams.get("format");

    if (!reportType || !reportFormat) {
      return NextResponse.json(
        { error: "Tipo y formato de reporte requeridos" },
        { status: 400 }
      );
    }

    let workbook: XLSX.WorkBook;
    let filename: string;

    switch (reportType) {
      case "cronograma":
        const cronogramaData = await generateCronogramaReport();
        workbook = cronogramaData.workbook;
        filename = cronogramaData.filename;
        break;

      case "avance":
        const avanceData = await generateAvanceReport();
        workbook = avanceData.workbook;
        filename = avanceData.filename;
        break;

      case "recursos":
        const recursosData = await generateRecursosReport();
        workbook = recursosData.workbook;
        filename = recursosData.filename;
        break;

      case "clientes":
        const clientesData = await generateClientesReport();
        workbook = clientesData.workbook;
        filename = clientesData.filename;
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de reporte no válido" },
          { status: 400 }
        );
    }

    // Generar el archivo Excel
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retornar el archivo
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}

async function generateCronogramaReport() {
  const projects = await prisma.project.findMany({
    include: {
      client: true,
      manager: true,
      phases: {
        orderBy: { order: "asc" },
        include: {
          activities: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = XLSX.utils.book_new();

  // Crear hoja de resumen
  const summaryData = projects.map((p) => ({
    Proyecto: p.name,
    Cliente: p.client.name,
    Estado: p.status,
    "Fecha Inicio": p.startDate
      ? format(new Date(p.startDate), "dd/MM/yyyy")
      : "-",
    PM: p.manager?.name || "-",
    Fases: p.phases.length,
    Actividades: p.phases.reduce((sum, ph) => sum + ph.activities.length, 0),
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Crear hoja de cronograma detallado
  const cronogramaData: Record<string, unknown>[] = [];
  projects.forEach((project) => {
    project.phases.forEach((phase) => {
      phase.activities.forEach((activity) => {
        cronogramaData.push({
          Proyecto: project.name,
          Fase: phase.name,
          "Tipo Fase": phase.type,
          Codigo: activity.code,
          Actividad: activity.name,
          "Fecha Inicio": activity.startDate
            ? format(new Date(activity.startDate), "dd/MM/yyyy")
            : "-",
          "Fecha Fin": activity.endDate
            ? format(new Date(activity.endDate), "dd/MM/yyyy")
            : "-",
          "Duracion (dias)": activity.durationDays,
          Estado: activity.status,
          "Progreso %": activity.progress,
        });
      });
    });
  });

  const cronogramaSheet = XLSX.utils.json_to_sheet(cronogramaData);
  XLSX.utils.book_append_sheet(workbook, cronogramaSheet, "Cronograma");

  return {
    workbook,
    filename: `Cronograma_Proyectos_${format(new Date(), "yyyyMMdd")}`,
  };
}

async function generateAvanceReport() {
  const projects = await prisma.project.findMany({
    include: {
      client: true,
      manager: true,
      phases: {
        include: {
          activities: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const workbook = XLSX.utils.book_new();

  const avanceData = projects.map((project) => {
    const phases = project.phases.filter((p) => p.type !== "PREPARE");
    const totalActivities = phases.reduce(
      (sum, ph) => sum + ph.activities.length,
      0
    );
    const completedActivities = phases.reduce(
      (sum, ph) =>
        sum + ph.activities.filter((a) => a.status === "COMPLETADO").length,
      0
    );
    const inProgressActivities = phases.reduce(
      (sum, ph) =>
        sum + ph.activities.filter((a) => a.status === "EN_PROGRESO").length,
      0
    );
    const progress =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

    return {
      Proyecto: project.name,
      Cliente: project.client.name,
      Estado: project.status,
      "Total Actividades": totalActivities,
      Completadas: completedActivities,
      "En Progreso": inProgressActivities,
      Pendientes: totalActivities - completedActivities - inProgressActivities,
      "Avance %": progress,
      PM: project.manager?.name || "-",
    };
  });

  const avanceSheet = XLSX.utils.json_to_sheet(avanceData);
  XLSX.utils.book_append_sheet(workbook, avanceSheet, "Avance");

  return {
    workbook,
    filename: `Reporte_Avance_${format(new Date(), "yyyyMMdd")}`,
  };
}

async function generateRecursosReport() {
  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      role: true,
      consultorLevel: true,
      assignments: {
        where: { active: true },
        include: {
          project: {
            include: { client: true },
          },
        },
      },
      projectsAsManager: {
        include: { client: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const workbook = XLSX.utils.book_new();

  // Resumen de recursos
  const resumenData = users.map((user) => {
    const totalAllocation = user.assignments.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    );
    return {
      Nombre: user.name,
      Email: user.email,
      Rol: user.role.name,
      Nivel: user.consultorLevel?.name || "-",
      "Proyectos Asignados": user.assignments.length,
      "Proyectos como PM": user.projectsAsManager.length,
      "Asignacion Total %": totalAllocation,
      Disponibilidad: Math.max(0, 100 - totalAllocation) + "%",
    };
  });

  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen Recursos");

  // Detalle de asignaciones
  const detalleData: Record<string, unknown>[] = [];
  users.forEach((user) => {
    user.assignments.forEach((assignment) => {
      detalleData.push({
        Recurso: user.name,
        Rol: user.role.name,
        Proyecto: assignment.project.name,
        Cliente: assignment.project.client.name,
        "Asignacion %": assignment.allocationPercentage,
        "Horas/Dia": assignment.hoursPerDay,
      });
    });
  });

  const detalleSheet = XLSX.utils.json_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(workbook, detalleSheet, "Detalle Asignaciones");

  return {
    workbook,
    filename: `Utilizacion_Recursos_${format(new Date(), "yyyyMMdd")}`,
  };
}

async function generateClientesReport() {
  const clients = await prisma.client.findMany({
    where: { active: true },
    include: {
      contacts: {
        where: { active: true },
      },
      projects: {
        include: {
          manager: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const workbook = XLSX.utils.book_new();

  // Resumen de clientes
  const resumenData = clients.map((client) => {
    const primaryContact =
      client.contacts.find((c) => c.isPrimary) || client.contacts[0];
    const activeProjects = client.projects.filter(
      (p) => p.status !== "COMPLETADO" && p.status !== "CANCELADO"
    ).length;
    const completedProjects = client.projects.filter(
      (p) => p.status === "COMPLETADO"
    ).length;

    return {
      Cliente: client.name,
      RUC: client.ruc || "-",
      "Contacto Principal": primaryContact?.name || "-",
      Email: primaryContact?.email || "-",
      Telefono: primaryContact?.phone || "-",
      "Total Proyectos": client.projects.length,
      "Proyectos Activos": activeProjects,
      "Proyectos Completados": completedProjects,
    };
  });

  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Clientes");

  // Proyectos por cliente
  const proyectosData: Record<string, unknown>[] = [];
  clients.forEach((client) => {
    client.projects.forEach((project) => {
      proyectosData.push({
        Cliente: client.name,
        Proyecto: project.name,
        Estado: project.status,
        Herramienta: project.tool,
        "Fecha Inicio": project.startDate
          ? format(new Date(project.startDate), "dd/MM/yyyy")
          : "-",
        PM: project.manager?.name || "-",
      });
    });
  });

  const proyectosSheet = XLSX.utils.json_to_sheet(proyectosData);
  XLSX.utils.book_append_sheet(workbook, proyectosSheet, "Proyectos");

  return {
    workbook,
    filename: `Proyectos_por_Cliente_${format(new Date(), "yyyyMMdd")}`,
  };
}
