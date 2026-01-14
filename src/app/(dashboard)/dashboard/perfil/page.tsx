import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Briefcase, Calendar, Shield, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      consultorLevel: true,
      projectsAsManager: {
        where: { status: { not: "COMPLETADO" } },
        select: { id: true, name: true, status: true },
        take: 5,
      },
      assignments: {
        include: {
          project: {
            select: { id: true, name: true, status: true },
          },
        },
        where: {
          project: { status: { not: "COMPLETADO" } },
        },
        take: 5,
      },
    },
  });

  return user;
}

export default async function PerfilPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserProfile(session.user.id);

  if (!user) {
    redirect("/login");
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

  const roleColors: Record<string, string> = {
    MANAGER: "bg-purple-100 text-purple-800",
    ARQUITECTO_RPA: "bg-blue-100 text-blue-800",
    ANALISTA_FUNCIONAL: "bg-green-100 text-green-800",
    CONSULTOR: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Informacion de tu cuenta y proyectos asignados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informacion Personal */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Badge className={roleColors[user.role.code] || "bg-gray-100"}>
                {user.role.name}
              </Badge>
            </div>
            {user.consultorLevel && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Nivel:</span>
                <Badge variant="outline">{user.consultorLevel.name}</Badge>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Desde:</span>
              <span className="text-sm">
                {format(new Date(user.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Proyectos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Mis Proyectos
            </CardTitle>
            <CardDescription>
              Proyectos activos donde participas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Proyectos como Manager */}
            {user.projectsAsManager.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Como Project Manager
                </h4>
                <div className="space-y-2">
                  {user.projectsAsManager.map((project) => (
                    <a
                      key={project.id}
                      href={`/dashboard/proyectos/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <span className="font-medium">{project.name}</span>
                      <Badge variant={project.status === "EN_PROGRESO" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Proyectos Asignados */}
            {user.assignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Como Recurso Asignado
                </h4>
                <div className="space-y-2">
                  {user.assignments.map((assignment) => (
                    <a
                      key={assignment.id}
                      href={`/dashboard/proyectos/${assignment.project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <span className="font-medium">{assignment.project.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({assignment.allocationPercentage}%)
                        </span>
                      </div>
                      <Badge variant={assignment.project.status === "EN_PROGRESO" ? "default" : "secondary"}>
                        {assignment.project.status}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {user.projectsAsManager.length === 0 && user.assignments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tienes proyectos activos asignados
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
