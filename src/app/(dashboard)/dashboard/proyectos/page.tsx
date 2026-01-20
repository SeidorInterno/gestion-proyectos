import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { ProjectDialog } from "./project-dialog";
import { ProjectsTable } from "./projects-table";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectsViewToggle } from "./projects-view-toggle";
import { cn } from "@/lib/utils";
import {
  calculateProgressVariance,
  getProjectEndDate,
  calculateEstimatedProgress,
  calculateDelayedActivities,
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
    const estimatedProgress = calculateEstimatedProgress(project.phases);
    const delayedActivities = calculateDelayedActivities(project.phases);
    const progressStatus = calculateProgressVariance(estimatedProgress, progress, delayedActivities);

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

  // Calcular KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "EN_PROGRESO").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETADO").length;
  const pausedProjects = projects.filter((p) => p.status === "PAUSADO").length;
  const atRisk = projects.filter((p) => p.progressStatus === "behind" || p.progressStatus === "critical").length;

  const kpis = [
    { label: "Total", value: totalProjects, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { label: "Activos", value: activeProjects, color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Completados", value: completedProjects, color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
    ...(pausedProjects > 0 ? [{ label: "Pausados", value: pausedProjects, color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" }] : []),
    ...(atRisk > 0 ? [{ label: "En Riesgo", value: atRisk, color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" }] : []),
  ];

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
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Lista de Proyectos
              </CardTitle>
              {/* KPI Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {kpis.map((kpi) => (
                  <span
                    key={kpi.label}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      kpi.color
                    )}
                  >
                    <span className="font-bold">{kpi.value}</span>
                    {kpi.label}
                  </span>
                ))}
              </div>
            </div>
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
