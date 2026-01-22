import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-utils";
import { TICKET_STAGES, TICKET_TYPES, TICKET_PRIORITIES } from "@/lib/support-utils";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("tickets", "read");

    const searchParams = request.nextUrl.searchParams;
    const poolId = searchParams.get("poolId");
    const formatType = searchParams.get("format") || "csv";

    if (!poolId) {
      return NextResponse.json(
        { error: "poolId es requerido" },
        { status: 400 }
      );
    }

    // Get pool info
    const pool = await prisma.supportPool.findUnique({
      where: { id: poolId },
      select: { name: true, pep: true },
    });

    if (!pool) {
      return NextResponse.json(
        { error: "Bolsa no encontrada" },
        { status: 404 }
      );
    }

    // Get tickets with all data
    const tickets = await prisma.supportTicket.findMany({
      where: {
        poolId,
        deletedAt: null,
      },
      include: {
        flow: { select: { name: true } },
        assignedTo: { select: { name: true } },
        createdBy: { select: { name: true } },
        timeEntries: {
          select: { hours: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV data
    const headers = [
      "Código",
      "Título",
      "Tipo",
      "Prioridad",
      "Etapa",
      "Flujo",
      "Asignado a",
      "Creado por",
      "Email Reportero",
      "Fecha Reportado",
      "Fecha Incidente",
      "Horas Estimadas",
      "Horas Reales",
      "Descripción",
    ];

    const rows = tickets.map((ticket) => {
      const totalHours = ticket.timeEntries.reduce((sum, e) => sum + e.hours, 0);

      return [
        ticket.code,
        ticket.title.replace(/"/g, '""'), // Escape quotes
        TICKET_TYPES[ticket.type as keyof typeof TICKET_TYPES]?.label || ticket.type,
        TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES]?.label || ticket.priority,
        TICKET_STAGES[ticket.stage as keyof typeof TICKET_STAGES]?.label || ticket.stage,
        ticket.flow?.name || "",
        ticket.assignedTo?.name || "Sin asignar",
        ticket.createdBy.name,
        ticket.reporterEmail,
        format(new Date(ticket.reportedDate), "yyyy-MM-dd HH:mm"),
        ticket.incidentDate
          ? format(new Date(ticket.incidentDate), "yyyy-MM-dd")
          : "",
        ticket.estimatedHours?.toString() || "",
        totalHours.toString(),
        ticket.description.replace(/"/g, '""').replace(/\n/g, " "), // Escape quotes and newlines
      ];
    });

    // Generate CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    const filename = `tickets_${pool.pep}_${format(new Date(), "yyyyMMdd")}.csv`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Error al exportar tickets" },
      { status: 500 }
    );
  }
}
