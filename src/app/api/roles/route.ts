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

    // Solo MANAGER puede ver roles
    if (session.user.roleCode !== "MANAGER") {
      return NextResponse.json(
        { error: "Sin permisos para ver roles" },
        { status: 403 }
      );
    }

    const roles = await prisma.role.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        hasLevels: true,
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Error al obtener roles" },
      { status: 500 }
    );
  }
}
