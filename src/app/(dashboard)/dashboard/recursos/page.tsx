import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, AlertTriangle, CheckCircle2, Clock, Briefcase } from "lucide-react";
import { ResourceFilters } from "./resource-filters";
import { cn } from "@/lib/utils";

// Colores semánticos por rol - consistentes con usuarios
const roleStyles: Record<string, string> = {
  MANAGER: "bg-purple-100 text-purple-700 dark:bg-purple-500/30 dark:text-purple-200 border border-purple-200 dark:border-purple-500/50",
  ARQUITECTO_RPA: "bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200 border border-blue-200 dark:border-blue-500/50",
  ANALISTA_FUNCIONAL: "bg-teal-100 text-teal-700 dark:bg-teal-500/30 dark:text-teal-200 border border-teal-200 dark:border-teal-500/50",
  CONSULTOR: "bg-amber-100 text-amber-700 dark:bg-amber-500/30 dark:text-amber-200 border border-amber-200 dark:border-amber-500/50",
};

async function getResourcesWithAllocation() {
  const users = await prisma.user.findMany({
    where: { active: true },
    include: {
      role: true,
      consultorLevel: true,
      assignments: {
        where: { active: true },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => {
    // Filtrar asignaciones a proyectos no eliminados
    const activeAssignments = user.assignments.filter(a => a.project && !a.project.deletedAt);

    const totalAllocation = activeAssignments.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    );
    const totalHours = activeAssignments.reduce(
      (sum, a) => sum + a.hoursPerDay,
      0
    );

    return {
      ...user,
      assignments: activeAssignments,
      totalAllocation,
      totalHours,
      isOverallocated: totalAllocation > 100,
      availableCapacity: Math.max(0, 100 - totalAllocation),
    };
  });
}

function CapacityBar({ allocation }: { allocation: number }) {
  const percentage = Math.min(allocation, 100);
  const isOver = allocation > 100;
  const isHigh = allocation > 80;

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isOver
              ? "bg-red-500"
              : isHigh
              ? "bg-amber-500"
              : allocation > 0
              ? "bg-emerald-500"
              : "bg-muted"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={`text-sm font-medium tabular-nums w-12 text-right ${
          isOver
            ? "text-red-500"
            : isHigh
            ? "text-amber-500"
            : "text-muted-foreground"
        }`}
      >
        {allocation}%
      </span>
    </div>
  );
}

function StatusBadge({ allocation }: { allocation: number }) {
  if (allocation > 100) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Sobre-asignado
      </Badge>
    );
  }
  if (allocation === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Disponible
      </Badge>
    );
  }
  if (allocation < 100) {
    return (
      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <Clock className="h-3 w-3" />
        Parcial
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Briefcase className="h-3 w-3" />
      Ocupado
    </Badge>
  );
}

export default async function RecursosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const resources = await getResourcesWithAllocation();
  const params = await searchParams;
  const filter = params.filter || "all";

  const overallocatedCount = resources.filter((r) => r.isOverallocated).length;
  const availableCount = resources.filter((r) => r.totalAllocation === 0).length;
  const partialCount = resources.filter(
    (r) => r.totalAllocation > 0 && r.totalAllocation < 100
  ).length;
  const occupiedCount = resources.filter((r) => r.totalAllocation === 100).length;

  // Filtrar recursos según el filtro seleccionado
  const filteredResources = resources.filter((r) => {
    switch (filter) {
      case "available":
        return r.totalAllocation === 0;
      case "partial":
        return r.totalAllocation > 0 && r.totalAllocation < 100;
      case "occupied":
        return r.totalAllocation === 100;
      case "overallocated":
        return r.isOverallocated;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recursos</h1>
        <p className="text-muted-foreground">
          Gestión de asignación de recursos a proyectos
        </p>
      </div>

      {/* KPIs compactos */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Disponibles</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{availableCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Parciales</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{partialCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Ocupados</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{occupiedCount}</p>
              </div>
              <Briefcase className="h-8 w-8 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Sobre-asignados</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overallocatedCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Recursos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipo
              </CardTitle>
              <CardDescription>
                {filteredResources.length} de {resources.length} colaboradores
              </CardDescription>
            </div>
            <ResourceFilters
              currentFilter={filter}
              counts={{
                all: resources.length,
                available: availableCount,
                partial: partialCount,
                occupied: occupiedCount,
                overallocated: overallocatedCount,
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Proyectos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.map((resource) => {
                const initials = resource.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className={
                              resource.isOverallocated
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : resource.totalAllocation === 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-primary/10 text-primary"
                            }
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none mb-1">{resource.name}</p>
                          <p className="text-sm text-muted-foreground">{resource.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit",
                          roleStyles[resource.role?.code || ""] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
                        )}>
                          {resource.role?.name || "Sin rol"}
                        </span>
                        {resource.consultorLevel && (
                          <span className="text-xs text-muted-foreground">
                            {resource.consultorLevel.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge allocation={resource.totalAllocation} />
                    </TableCell>
                    <TableCell>
                      <CapacityBar allocation={resource.totalAllocation} />
                    </TableCell>
                    <TableCell>
                      {resource.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {resource.assignments.slice(0, 2).map((assignment) => (
                            <Badge
                              key={assignment.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {assignment.project.name.length > 15
                                ? `${assignment.project.name.slice(0, 15)}...`
                                : assignment.project.name}
                              <span className="ml-1 text-muted-foreground">
                                {assignment.allocationPercentage}%
                              </span>
                            </Badge>
                          ))}
                          {resource.assignments.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.assignments.length - 2} más
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredResources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No hay recursos con este filtro
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
