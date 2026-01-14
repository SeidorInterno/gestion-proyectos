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

    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: {
          code: { in: ["MANAGER", "ARQUITECTO_RPA"] },
        },
      },
      orderBy: { name: "asc" },
      include: {
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
