import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { ProjectDialog } from "./project-dialog";
import { ProjectsTable } from "./projects-table";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectsViewToggle } from "./projects-view-toggle";
import {
  calculateProgressVariance,
  getProjectEndDate,
  calculateEstimatedProgress,
} from "@/lib/progress-utils";

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null, // Only show non-deleted projects
    },
    include: {
      client: true,
      manager: true,
      phases: {
        include: {
          activities: {
            where: { deletedAt: null },
          },
        },
      },
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcular progreso de cada proyecto (excluyendo fase PREPARE)
  return projects.map((project) => {
    // Filtrar fases excluyendo PREPARE (trabajo pre-kickoff)
    const projectPhases = project.phases.filter((p) => p.type !== "PREPARE");

    const totalActivities = projectPhases.reduce(
      (sum, phase) => sum + phase.activities.length,
      0
    );
    const completedActivities = projectPhases.reduce(
      (sum, phase) =>
        sum + phase.activities.filter((a) => a.status === "COMPLETADO").length,
      0
    );
    const progress =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

    // Calcular fecha de fin y estado de progreso
    const endDate = getProjectEndDate(projectPhases, project.startDate || new Date());
    const estimatedProgress = calculateEstimatedProgress(project.startDate, endDate);
    const progressStatus = calculateProgressVariance(estimatedProgress, progress);

    // Determinar fase actual
    const currentPhase = project.phases.find((phase) =>
      phase.activities.some(
        (a) => a.status === "EN_PROGRESO" || a.status === "PENDIENTE"
      )
    );

    return {
      ...project,
      progress,
      endDate,
      progressStatus,
      currentPhase: currentPhase?.name || "Completado",
    };
  });
}

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const projects = await getProjects();
  const params = await searchParams;
  const view = params.view || "table";

  // Prepare timeline data
  const timelineProjects = projects.map((p) => {
    // Calculate phase dates from activities
    const phasesWithDates = p.phases.map((phase) => {
      const activityDates = phase.activities
        .filter((a) => a.startDate || a.endDate)
        .flatMap((a) => [a.startDate, a.endDate].filter(Boolean) as Date[]);

      const startDate = activityDates.length > 0
        ? new Date(Math.min(...activityDates.map((d) => d.getTime())))
        : null;
      const endDate = activityDates.length > 0
        ? new Date(Math.max(...activityDates.map((d) => d.getTime())))
        : null;

      return {
        id: phase.id,
        name: phase.name,
        type: phase.type,
        startDate,
        endDate,
      };
    });

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      client: { name: p.client.name },
      phases: phasesWithDates,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona los proyectos RPA de Seidor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectsViewToggle currentView={view} />
          <ProjectDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </ProjectDialog>
        </div>
      </div>

      {view === "timeline" ? (
        <ProjectTimeline projects={timelineProjects} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Lista de Proyectos
            </CardTitle>
            <CardDescription>
              {projects.length} proyectos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Cargando...</div>}>
              <ProjectsTable projects={projects} />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
