import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Roles que pueden ver clientes
const ALLOWED_ROLES = ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar autorización - CONSULTOR no puede ver clientes
    if (!ALLOWED_ROLES.includes(session.user.roleCode)) {
      return NextResponse.json(
        { error: "Sin permisos para ver clientes" },
        { status: 403 }
      );
    }

    const clients = await prisma.client.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}
