import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Roles que pueden ver clientes
const ALLOWED_ROLES = ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"];

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}
