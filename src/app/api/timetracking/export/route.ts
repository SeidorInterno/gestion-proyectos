import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userRole = session.user.roleCode;

    // CONSULTOR no puede exportar
    if (userRole === "CONSULTOR") {
      return NextResponse.json(
        { message: "No tienes permisos para exportar" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    // Construir filtros
    const where: Record<string, unknown> = {};

    // ANALISTA solo ve sus propias entradas
    const canViewAll = ["MANAGER", "ARQUITECTO_RPA"].includes(userRole || "");
    if (!canViewAll) {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    // Filtro de fechas
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.date as Record<string, Date>).lte = end;
      }
    }

    // Filtro de proyecto
    if (projectId) {
      where.projectId = projectId;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
            pep: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // Generar CSV
    const headers = [
      "Fecha",
      "Usuario",
      "Email",
      "PEP",
      "Proyecto",
      "Tarea",
      "Descripcion",
      "Horas",
    ];

    const rows = entries.map((entry) => [
      formatDateForCSV(entry.date),
      escapeCSV(entry.user.name),
      escapeCSV(entry.user.email),
      escapeCSV(entry.project.pep),
      escapeCSV(entry.project.name),
      escapeCSV(entry.task || ""),
      escapeCSV(entry.description),
      entry.hours.toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Agregar BOM para Excel
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="registro-horas-${startDate || "all"}-${endDate || "all"}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting time entries:", error);
    return NextResponse.json(
      { message: "Error al exportar" },
      { status: 500 }
    );
  }
}

function formatDateForCSV(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
}

function escapeCSV(value: string): string {
  if (!value) return "";
  // Si contiene comas, comillas o saltos de línea, envolver en comillas
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
