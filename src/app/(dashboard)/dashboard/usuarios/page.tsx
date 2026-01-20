import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { NewUserButton } from "./new-user-button";
import { UsersTable } from "./users-table";
import { cn } from "@/lib/utils";

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: true,
      consultorLevel: true,
      _count: {
        select: {
          projectsAsManager: true,
          assignments: true,
        },
      },
    },
  });
}

export default async function UsuariosPage() {
  const session = await auth();

  // Solo MANAGER puede ver esta pagina
  if (session?.user?.roleCode !== "MANAGER") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  // Calcular KPIs por rol
  const totalUsers = users.length;
  const managerCount = users.filter(u => u.role?.code === "MANAGER").length;
  const arquitectoCount = users.filter(u => u.role?.code === "ARQUITECTO_RPA").length;
  const analistaCount = users.filter(u => u.role?.code === "ANALISTA_FUNCIONAL").length;
  const consultorCount = users.filter(u => u.role?.code === "CONSULTOR").length;
  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = totalUsers - activeCount;

  const kpis = [
    { label: "Total", value: totalUsers, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { label: "Managers", value: managerCount, color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
    { label: "Arquitectos", value: arquitectoCount, color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Analistas", value: analistaCount, color: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300" },
    { label: "Consultores", value: consultorCount, color: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" },
    { label: "Activos", value: activeCount, color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
    ...(inactiveCount > 0 ? [{ label: "Inactivos", value: inactiveCount, color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        <NewUserButton />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Lista de Usuarios
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
          <UsersTable users={users} currentUserId={session?.user?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
