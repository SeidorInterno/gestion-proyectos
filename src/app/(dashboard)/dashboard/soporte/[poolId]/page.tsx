import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getSupportPoolById, getUsersForSelect, getProjectsForSelect } from "../actions";
import { PoolHeader } from "./pool-header";
import { PoolTeam } from "./pool-team";
import { PoolFlows } from "./pool-flows";
import { TicketsKanban } from "./tickets-kanban";
import { TicketsTable } from "./tickets-table";
import { TicketDialog } from "./ticket-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Plus, Kanban, Table, Users, Workflow } from "lucide-react";
import { hasPermission } from "@/lib/auth-utils";

interface PageProps {
  params: Promise<{ poolId: string }>;
  searchParams?: Promise<{ tab?: string; view?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { poolId } = await params;
  const pool = await getSupportPoolById(poolId);

  if (!pool) {
    return { title: "Bolsa no encontrada | Seidor RPA" };
  }

  return {
    title: `${pool.name} | Soporte | Seidor RPA`,
    description: `Gestión de tickets de soporte para ${pool.name}`,
  };
}

async function PoolContent({ poolId, tab, view }: { poolId: string; tab: string; view: string }) {
  const [pool, users, canCreateTicket, canManageTeam, canManageFlows] =
    await Promise.all([
      getSupportPoolById(poolId),
      getUsersForSelect(),
      hasPermission("tickets", "create"),
      hasPermission("supportPools", "update"),
      hasPermission("supportFlows", "create"),
    ]);

  if (!pool) {
    notFound();
  }

  // Cargar proyectos del cliente para el dropdown de flujos/procesos
  const clientProjects = await getProjectsForSelect(pool.clientId);

  const activeTickets = pool.tickets.filter(
    (t) => !["ATENDIDO", "CANCELADO"].includes(t.stage)
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/soporte">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Header with KPIs */}
      <PoolHeader pool={pool} />

      {/* Tabs */}
      <Tabs defaultValue={tab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tickets" className="gap-2">
              <Kanban className="h-4 w-4" />
              Tickets ({activeTickets.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Equipo ({pool.assignments.length})
            </TabsTrigger>
            <TabsTrigger value="flows" className="gap-2">
              <Workflow className="h-4 w-4" />
              Flujos ({pool.flows.length})
            </TabsTrigger>
          </TabsList>

          {tab === "tickets" && canCreateTicket && pool.status === "ACTIVA" && (
            <TicketDialog poolId={pool.id} flows={pool.flows} users={users} clientProjects={clientProjects}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ticket
              </Button>
            </TicketDialog>
          )}
        </div>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Vista:</span>
            <div className="flex border rounded-lg overflow-hidden">
              <Link
                href={`/dashboard/soporte/${poolId}?tab=tickets&view=kanban`}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  view === "kanban"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Link>
              <Link
                href={`/dashboard/soporte/${poolId}?tab=tickets&view=table`}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Table className="h-4 w-4" />
                Tabla
              </Link>
            </div>
          </div>

          {pool.tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2">
                ¡Todo bajo control!
              </h3>
              <p className="text-muted-foreground mb-4">
                No hay tickets pendientes en esta bolsa de soporte.
              </p>
              {canCreateTicket && pool.status === "ACTIVA" && (
                <TicketDialog poolId={pool.id} flows={pool.flows} users={users} clientProjects={clientProjects}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Ticket
                  </Button>
                </TicketDialog>
              )}
            </div>
          ) : view === "table" ? (
            <TicketsTable
              tickets={pool.tickets}
              poolId={pool.id}
              flows={pool.flows}
              users={users}
              clientProjects={clientProjects}
            />
          ) : (
            <TicketsKanban
              tickets={pool.tickets}
              poolId={pool.id}
              flows={pool.flows}
              users={users}
              clientProjects={clientProjects}
            />
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <PoolTeam
            poolId={pool.id}
            assignments={pool.assignments}
            allUsers={users}
            canManage={canManageTeam}
          />
        </TabsContent>

        {/* Flows Tab */}
        <TabsContent value="flows">
          <PoolFlows
            poolId={pool.id}
            flows={pool.flows}
            canManage={canManageFlows}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
      <Skeleton className="h-12 w-96" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function PoolDetailPage({ params, searchParams }: PageProps) {
  const { poolId } = await params;
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams?.tab || "tickets";
  const view = resolvedSearchParams?.view || "kanban";

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PoolContent poolId={poolId} tab={tab} view={view} />
    </Suspense>
  );
}
