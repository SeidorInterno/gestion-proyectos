import { Suspense } from "react";
import { getSupportPools, getClientsForSelect, getProjectsForSelect, getUsersForSelect } from "./actions";
import { SupportPoolsTable } from "./support-pools-table";
import { SupportPoolDialog } from "./support-pool-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Headphones, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { hasPermission } from "@/lib/auth-utils";

export const metadata = {
  title: "Soporte | Seidor RPA",
  description: "Gestión de bolsas de horas de soporte",
};

async function SupportPoolsContent() {
  const [pools, clients, projects, users, canCreate] = await Promise.all([
    getSupportPools(),
    getClientsForSelect(),
    getProjectsForSelect(),
    getUsersForSelect(),
    hasPermission("supportPools", "create"),
  ]);

  // KPIs
  const totalPools = pools.length;
  const activePools = pools.filter((p) => p.status === "ACTIVA").length;
  const totalHours = pools.reduce((acc, p) => acc + p.totalHours, 0);
  const usedHours = pools.reduce((acc, p) => acc + p.usedHours, 0);
  const lowHoursPools = pools.filter((p) => p.usedPercentage >= 80).length;
  const openTickets = pools.reduce((acc, p) => acc + p._count.tickets, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bolsas de Soporte</h1>
          <p className="text-muted-foreground">
            Gestiona las bolsas de horas de soporte y sus tickets
          </p>
        </div>
        {canCreate && (
          <SupportPoolDialog clients={clients} projects={projects}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Bolsa
            </Button>
          </SupportPoolDialog>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Bolsas Activas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {activePools} <span className="text-sm font-normal">/ {totalPools}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Horas Disponibles</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {totalHours - usedHours}h{" "}
                  <span className="text-sm font-normal">/ {totalHours}h</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300">Horas Bajas</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {lowHoursPools}{" "}
                  <span className="text-sm font-normal">bolsa(s)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Tickets Abiertos</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {openTickets}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {pools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin bolsas de soporte</h3>
            <p className="text-muted-foreground text-center mb-4">
              No hay bolsas de soporte registradas.
              {canCreate && " Creá una nueva bolsa para empezar."}
            </p>
            {canCreate && (
              <SupportPoolDialog clients={clients} projects={projects}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Bolsa
                </Button>
              </SupportPoolDialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <SupportPoolsTable
          pools={pools}
          clients={clients}
          projects={projects}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-96" />
    </div>
  );
}

export default function SoportePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SupportPoolsContent />
    </Suspense>
  );
}
