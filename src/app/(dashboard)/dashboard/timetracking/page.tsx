import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, CalendarDays, FolderKanban } from "lucide-react";
import { auth } from "@/lib/auth";
import { getTimeEntries, getUserAssignedProjects, getTimeEntriesStats } from "./actions";
import { TimeEntriesTable } from "./time-entries-table";
import { TimeEntryDialog } from "./time-entry-dialog";
import { ExportButton } from "./export-button";

export default async function TimetrackingPage() {
  const session = await auth();
  const currentUserId = session?.user?.id || "";
  const userRole = session?.user?.roleCode || "CONSULTOR";

  const [entries, projects, stats] = await Promise.all([
    getTimeEntries(),
    getUserAssignedProjects(),
    getTimeEntriesStats(),
  ]);

  const canExport = ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de Horas</h1>
          <p className="text-muted-foreground">
            Registra y consulta las horas trabajadas por proyecto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && <ExportButton />}
          <TimeEntryDialog projects={projects}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Entrada
            </Button>
          </TimeEntryDialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Horas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Horas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Asignados a ti</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty state si no hay proyectos asignados */}
      {projects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Sin proyectos asignados</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para registrar horas, primero necesitas estar asignado a un proyecto.
              Contacta a tu Project Manager para que te asigne a un proyecto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registros de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeEntriesTable
              entries={entries}
              projects={projects}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
