import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}
