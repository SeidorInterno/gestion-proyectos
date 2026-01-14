import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  FileText,
  ArrowLeft,
  Download,
  Settings,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { GanttChartWrapper } from "@/components/gantt/gantt-chart-wrapper";
import { ProjectTeam } from "./project-team";
import { ProjectEvents } from "./project-events";
import { ProgressComparisonCard } from "@/components/progress-comparison-card";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import {
  calculateActualProgress,
  calculateEstimatedProgress,
  getProjectEndDate,
} from "@/lib/progress-utils";

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      manager: true,
      phases: {
        orderBy: { order: "asc" },
        include: {
          activities: {
            orderBy: { order: "asc" },
          },
        },
      },
      assignments: {
        include: {
          user: {
            include: {
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      events: {
        include: {
          assignedTo: { select: { id: true, name: true } },
          reportedBy: { select: { id: true, name: true } },
          activity: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return project;
}

async function getUsers() {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return users;
}

async function getHolidays() {
  const currentYear = new Date().getFullYear();
  const holidays = await prisma.holiday.findMany({
    where: {
      year: { in: [currentYear, currentYear + 1] },
    },
  });
  return holidays.map((h) => ({ date: h.date, name: h.name }));
}

const statusLabels: Record<string, string> = {
  PLANIFICACION: "Planificacion",
  EN_PROGRESO: "En Progreso",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  PLANIFICACION: "secondary",
  EN_PROGRESO: "default",
  PAUSADO: "warning",
  COMPLETADO: "success",
  CANCELADO: "destructive",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, holidays, users, session] = await Promise.all([
    getProject(id),
    getHolidays(),
    getUsers(),
    auth(),
  ]);

  const currentUserId = session?.user?.id || "";

  // Calcular estadísticas
  const totalActivities = project.phases.reduce(
    (sum, phase) => sum + phase.activities.length,
    0
  );
  const completedActivities = project.phases.reduce(
    (sum, phase) =>
      sum + phase.activities.filter((a) => a.status === "COMPLETADO").length,
    0
  );

  // Calcular progreso real y estimado
  const actualProgress = calculateActualProgress(project.phases);
  const projectEndDate = getProjectEndDate(
    project.phases,
    project.startDate || new Date()
  );
  const estimatedProgress = calculateEstimatedProgress(
    project.startDate,
    projectEndDate
  );

  // Contar blockers activos
  const activeBlockers = project.events.filter(
    (e) =>
      e.category === "BLOCKER" &&
      (e.status === "ABIERTO" || e.status === "EN_PROGRESO")
  ).length;

  // Preparar periodos de bloqueo/pausa para el Gantt (convertir fechas a ISO strings)
  const blockerPeriods = project.events
    .filter((e) => e.category === "BLOCKER" || e.category === "PAUSE")
    .map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate ? e.endDate.toISOString() : null,
      impactDays: e.impactDays,
      isResolved: e.status === "RESUELTO" || e.status === "CERRADO",
      category: e.category as "BLOCKER" | "PAUSE",
    }));

  // Preparar actividades para el selector de eventos
  const allActivities = project.phases.flatMap((phase) =>
    phase.activities.map((a) => ({ id: a.id, code: a.code, name: a.name }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/proyectos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={statusVariants[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {project.client.name} | {project.code || "Sin código"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <ProgressComparisonCard
          actualProgress={actualProgress}
          estimatedProgress={estimatedProgress}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fecha Inicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.startDate ? formatDate(project.startDate) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">Fecha planificada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {project.manager?.name || "Sin asignar"}
            </div>
            <p className="text-xs text-muted-foreground">Responsable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.assignments.length}
            </div>
            <p className="text-xs text-muted-foreground">Recursos asignados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gantt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Eventos
            {activeBlockers > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeBlockers}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma del Proyecto</CardTitle>
              <CardDescription>
                Metodologia SAM (SMART AGILE Methodology)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GanttChartWrapper
                phases={project.phases}
                startDate={project.startDate || new Date()}
                holidays={holidays}
                projectStatus={project.status}
                projectId={project.id}
                activeBlockers={project.events
                  .filter(
                    (e) =>
                      e.category === "BLOCKER" &&
                      (e.status === "ABIERTO" || e.status === "EN_PROGRESO")
                  )
                  .map((e) => ({ id: e.id, title: e.title, type: e.type }))}
                blockerPeriods={blockerPeriods}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeam
            projectId={project.id}
            assignments={project.assignments}
          />
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentos del Proyecto</CardTitle>
              <CardDescription>
                PDD, DSD, Manuales y otros documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>No hay documentos cargados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <ProjectEvents
            projectId={project.id}
            currentUserId={currentUserId}
            events={project.events}
            activities={allActivities}
            users={users}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
