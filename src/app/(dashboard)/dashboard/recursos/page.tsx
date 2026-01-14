import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    const totalAllocation = user.assignments.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    );
    const totalHours = user.assignments.reduce(
      (sum, a) => sum + a.hoursPerDay,
      0
    );

    return {
      ...user,
      totalAllocation,
      totalHours,
      isOverallocated: totalAllocation > 100,
    };
  });
}


export default async function RecursosPage() {
  const resources = await getResourcesWithAllocation();

  const overallocatedCount = resources.filter((r) => r.isOverallocated).length;
  const availableCount = resources.filter(
    (r) => r.totalAllocation < 100
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recursos</h1>
        <p className="text-muted-foreground">
          Gestion de asignacion de recursos a proyectos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recursos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground">Colaboradores activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground">
              Con capacidad disponible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sobre-asignados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overallocatedCount}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atencion</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilizacion de Recursos
          </CardTitle>
          <CardDescription>
            Vista de asignacion de cada colaborador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource) => {
              const initials = resource.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={resource.id}
                  className={`p-4 rounded-lg border ${
                    resource.isOverallocated
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback
                          className={
                            resource.isOverallocated
                              ? "bg-yellow-500 text-white"
                              : "bg-primary text-primary-foreground"
                          }
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{resource.name}</p>
                          {resource.isOverallocated && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resource.email}
                        </p>
                      </div>
                      <Badge variant="outline">{resource.role.name}</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            resource.isOverallocated
                              ? "text-yellow-600"
                              : resource.totalAllocation > 80
                              ? "text-orange-500"
                              : "text-green-600"
                          }`}
                        >
                          {resource.totalAllocation}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {resource.totalHours.toFixed(1)} hrs/dia
                        </p>
                      </div>
                      <div className="w-32">
                        <Progress
                          value={Math.min(resource.totalAllocation, 100)}
                          className={`h-3 ${
                            resource.isOverallocated ? "[&>div]:bg-yellow-500" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Proyectos asignados */}
                  {resource.assignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Proyectos asignados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {resource.assignments.map((assignment) => (
                          <Badge key={assignment.id} variant="secondary">
                            {assignment.project.name} ({assignment.allocationPercentage}
                            %)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {resource.assignments.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Sin proyectos asignados
                    </p>
                  )}
                </div>
              );
            })}

            {resources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>No hay recursos registrados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
