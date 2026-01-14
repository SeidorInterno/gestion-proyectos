import { prisma } from "@/lib/prisma";
import { EventsKanban } from "./events-kanban";

async function getEvents() {
  return prisma.projectEvent.findMany({
    where: {
      deletedAt: null, // Only show non-deleted events
      project: {
        deletedAt: null, // Only from non-deleted projects
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          client: { select: { name: true } },
        },
      },
      reportedBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getProjects() {
  return prisma.project.findMany({
    where: {
      status: { not: "COMPLETADO" },
      deletedAt: null,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

async function getUsers() {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function EventosPage() {
  const [events, projects, users] = await Promise.all([
    getEvents(),
    getProjects(),
    getUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Gestiona issues, blockers, riesgos y decisiones de todos los proyectos
        </p>
      </div>

      <EventsKanban events={events} projects={projects} users={users} />
    </div>
  );
}
