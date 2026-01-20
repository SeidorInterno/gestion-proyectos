import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { NewClientButton } from "./new-client-button";
import { ClientsTable } from "./clients-table";
import { cn } from "@/lib/utils";

// Roles que pueden ver clientes
const ALLOWED_ROLES = ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"];
// Roles que pueden crear/editar clientes
const CAN_EDIT_ROLES = ["MANAGER", "ARQUITECTO_RPA"];

async function getClients() {
  const clients = await prisma.client.findMany({
    where: { active: true },
    include: {
      contacts: {
        where: { active: true },
        orderBy: { isPrimary: "desc" },
      },
      _count: {
        select: {
          projects: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return clients;
}

export default async function ClientesPage() {
  const session = await auth();

  // CONSULTOR no puede ver esta página
  if (!session?.user?.roleCode || !ALLOWED_ROLES.includes(session.user.roleCode)) {
    redirect("/dashboard");
  }

  const clients = await getClients();
  const canEdit = CAN_EDIT_ROLES.includes(session.user.roleCode);

  // Calcular KPIs
  const totalClients = clients.length;
  const totalProjects = clients.reduce((sum, c) => sum + c._count.projects, 0);
  const totalContacts = clients.reduce((sum, c) => sum + c.contacts.length, 0);
  const withProjects = clients.filter((c) => c._count.projects > 0).length;

  const kpis = [
    { label: "Clientes", value: totalClients, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { label: "Con Proyectos", value: withProjects, color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Proyectos", value: totalProjects, color: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
    { label: "Contactos", value: totalContacts, color: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes de Seidor RPA
          </p>
        </div>
        {canEdit && <NewClientButton />}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Clientes
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
            <ClientsTable clients={clients} canEdit={canEdit} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
