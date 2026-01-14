import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    // Solo MANAGER puede ver niveles de consultor
    if (session.user.roleCode !== "MANAGER") {
      return NextResponse.json(
        { error: "Sin permisos para ver niveles" },
        { status: 403 }
      );
    }

    const levels = await prisma.consultorLevel.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Error al obtener niveles" },
      { status: 500 }
    );
  }
}
