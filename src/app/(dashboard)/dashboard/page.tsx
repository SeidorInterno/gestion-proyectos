import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Pause,
  Activity,
  ArrowRight,
} from "lucide-react";
import { ResourceUtilizationChart } from "./dashboard-charts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

async function getDashboardStats() {
  const [
    proyectosActivos,
    proyectosCompletados,
    clientesActivos,
    recursosAsignados,
  ] = await Promise.all([
    prisma.project.count({
      where: { status: { in: ["EN_PROGRESO", "PLANIFICACION"] }, deletedAt: null },
    }),
    prisma.project.count({
      where: { status: "COMPLETADO", deletedAt: null },
    }),
    prisma.client.count({
      where: { active: true, projects: { some: {} } },
    }),
    prisma.user.count({
      where: { active: true, assignments: { some: { active: true } } },
    }),
  ]);

  return {
    proyectosActivos,
    proyectosCompletados,
    clientesActivos,
    recursosAsignados,
  };
}

async function getRecentProjects() {
  return prisma.project.findMany({
    where: {
      status: { not: "COMPLETADO" },
      deletedAt: null,
    },
    include: {
      client: { select: { name: true } },
      phases: {
        where: { type: { not: "PREPARE" } },
        include: {
          activities: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}

async function getProjectsAtRisk() {
  // Projects with active blockers or paused status
  const blockedProjects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      OR: [
        { status: "PAUSADO" },
        {
          events: {
            some: {
              category: "BLOCKER",
              status: { in: ["ABIERTO", "EN_PROGRESO"] },
              deletedAt: null,
            },
          },
        },
      ],
    },
    include: {
      client: { select: { name: true } },
      events: {
        where: {
          category: "BLOCKER",
          status: { in: ["ABIERTO", "EN_PROGRESO"] },
          deletedAt: null,
        },
        take: 1,
      },
    },
    take: 5,
  });

  return blockedProjects;
}

async function getResourceUtilization() {
  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      assignments: {
        where: { active: true },
        select: { allocationPercentage: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => ({
    name: user.name?.split(" ")[0] || "Usuario",
    utilizacion: user.assignments.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    ),
  }));
}

async function getRecentActivity() {
  const recentEvents = await prisma.projectEvent.findMany({
    include: {
      project: { select: { name: true } },
      reportedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return recentEvents;
}

async function getActiveBlockers() {
  return prisma.projectEvent.findMany({
    where: {
      category: "BLOCKER",
      status: { in: ["ABIERTO", "EN_PROGRESO"] },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();

  const [
    stats,
    recentProjects,
    projectsAtRisk,
    resourceUtilization,
    recentActivity,
    activeBlockers,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentProjects(),
    getProjectsAtRisk(),
    getResourceUtilization(),
    getRecentActivity(),
    getActiveBlockers(),
  ]);

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
      PLANIFICACION: { variant: "secondary", label: "Planificacion" },
      EN_PROGRESO: { variant: "default", label: "En Progreso", className: "bg-green-500" },
      COMPLETADO: { variant: "default", label: "Completado", className: "bg-emerald-500" },
      PAUSADO: { variant: "default", label: "Pausado", className: "bg-yellow-500" },
      CANCELADO: { variant: "destructive", label: "Cancelado" },
    };
    const c = config[estado] || { variant: "secondary" as const, label: estado };
    return (
      <Badge variant={c.variant} className={c.className}>
        {c.label}
      </Badge>
    );
  };

  const calculateProgress = (phases: { activities: { status: string }[] }[]) => {
    const allActivities = phases.flatMap((p) => p.activities);
    if (allActivities.length === 0) return 0;
    const completed = allActivities.filter((a) => a.status === "COMPLETADO").length;
    return Math.round((completed / allActivities.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, typeof AlertTriangle> = {
      BLOCKER: AlertOctagon,
      ISSUE: AlertTriangle,
      RISK: AlertTriangle,
      PAUSA: Pause,
    };
    return icons[category] || Activity;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      BLOCKER: "text-red-500 bg-red-50 border-red-200",
      ISSUE: "text-orange-500 bg-orange-50 border-orange-200",
      RISK: "text-yellow-500 bg-yellow-50 border-yellow-200",
      CHANGE_REQUEST: "text-blue-500 bg-blue-50 border-blue-200",
      DECISION: "text-purple-500 bg-purple-50 border-purple-200",
      PAUSA: "text-gray-500 bg-gray-50 border-gray-200",
    };
    return colors[category] || "text-gray-500 bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {session?.user?.name || "Usuario"}
        </h1>
        <p className="text-muted-foreground">
          Aqui tienes un resumen de tus proyectos RPA
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proyectos Activos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proyectosActivos}</div>
            <Link href="/dashboard/proyectos" className="text-xs text-primary hover:underline">
              Ver proyectos
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proyectos Completados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proyectosCompletados}</div>
            <p className="text-xs text-muted-foreground">
              Total historico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Activos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesActivos}</div>
            <Link href="/dashboard/clientes" className="text-xs text-primary hover:underline">
              Ver clientes
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recursos Asignados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recursosAsignados}</div>
            <Link href="/dashboard/recursos" className="text-xs text-primary hover:underline">
              Ver recursos
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Projects and Blockers */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Proyectos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Proyectos Recientes
            </CardTitle>
            <CardDescription>
              Estado actual de los proyectos activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No hay proyectos activos
                </p>
              ) : (
                recentProjects.map((proyecto) => {
                  const progress = calculateProgress(proyecto.phases);
                  return (
                    <Link
                      key={proyecto.id}
                      href={`/dashboard/proyectos/${proyecto.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors block"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{proyecto.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {proyecto.client.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getEstadoBadge(proyecto.status)}
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground w-8">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            {recentProjects.length > 0 && (
              <Link
                href="/dashboard/proyectos"
                className="flex items-center justify-center gap-1 mt-4 text-sm text-primary hover:underline"
              >
                Ver todos los proyectos <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Blockers Activos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-500" />
              Blockers Activos
            </CardTitle>
            <CardDescription>
              Impedimentos que requieren atencion inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeBlockers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay blockers activos</p>
                </div>
              ) : (
                activeBlockers.map((blocker) => (
                  <Link
                    key={blocker.id}
                    href={`/dashboard/proyectos/${blocker.project.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors block"
                  >
                    <AlertOctagon className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium truncate">{blocker.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {blocker.project.name}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Risk Projects and Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Proyectos en Riesgo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Proyectos en Riesgo
            </CardTitle>
            <CardDescription>
              Proyectos pausados o con blockers activos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectsAtRisk.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Todos los proyectos estan en buen estado</p>
                </div>
              ) : (
                projectsAtRisk.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/proyectos/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors block"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.client.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.status === "PAUSADO" && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                          <Pause className="h-3 w-3 mr-1" />
                          Pausado
                        </Badge>
                      )}
                      {project.events.length > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                          <AlertOctagon className="h-3 w-3 mr-1" />
                          Blocker
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Ultimos eventos registrados en proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No hay actividad reciente
                </p>
              ) : (
                recentActivity.map((event) => {
                  const Icon = getCategoryIcon(event.category);
                  const colorClass = getCategoryColor(event.category);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${colorClass}`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.project.name} • {formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafico de Utilizacion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Utilizacion de Recursos
          </CardTitle>
          <CardDescription>
            Porcentaje de asignacion de los colaboradores activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resourceUtilization.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>No hay recursos con asignaciones activas</p>
            </div>
          ) : (
            <ResourceUtilizationChart data={resourceUtilization} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
