"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Clock, Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteTimeEntry } from "./actions";
import { toast } from "@/hooks/use-toast";
import { TimeEntryDialog } from "./time-entry-dialog";

interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description: string;
  task: string | null;
  project: {
    id: string;
    name: string;
    pep: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  activity: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  pep: string;
  phases: {
    activities: {
      id: string;
      code: string;
      name: string;
    }[];
  }[];
}

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  projects: Project[];
  currentUserId: string;
  userRole: string;
}

export function TimeEntriesTable({
  entries,
  projects,
  currentUserId,
  userRole,
}: TimeEntriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const canEditAny = ["MANAGER", "ARQUITECTO_RPA"].includes(userRole);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchTerm === "" ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.project.pep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProject =
        projectFilter === "all" || entry.project.id === projectFilter;

      const entryDate = new Date(entry.date);
      const matchesDateFrom =
        !dateFrom || entryDate >= new Date(dateFrom);
      const matchesDateTo =
        !dateTo || entryDate <= new Date(dateTo + "T23:59:59");

      return matchesSearch && matchesProject && matchesDateFrom && matchesDateTo;
    });
  }, [entries, searchTerm, projectFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setProjectFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    projectFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  }, [filteredEntries]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeEntry(id);
      toast({
        title: "Entrada eliminada",
        description: "El registro de horas se eliminó correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la entrada",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripcion, tarea, proyecto..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[150px]"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="Desde"
        />

        <Input
          type="date"
          className="w-[150px]"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="Hasta"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {hasActiveFilters
            ? `Mostrando ${filteredEntries.length} de ${entries.length} registros`
            : `${entries.length} registros`}
        </span>
        <span className="font-medium text-foreground">
          Total: {totalHours.toFixed(1)} horas
        </span>
      </div>

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>PEP</TableHead>
            {canEditAny && <TableHead>Usuario</TableHead>}
            <TableHead>Tarea</TableHead>
            <TableHead>Descripcion</TableHead>
            <TableHead className="text-right">Horas</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map((entry) => {
            const canEdit = entry.user.id === currentUserId || canEditAny;
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell>{entry.project.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {entry.project.pep}
                  </Badge>
                </TableCell>
                {canEditAny && (
                  <TableCell className="text-sm">
                    {entry.user.name}
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {entry.task || "-"}
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {entry.description}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {entry.hours.toFixed(1)}h
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <TimeEntryDialog
                        projects={projects}
                        entry={{
                          id: entry.id,
                          date: entry.date,
                          hours: entry.hours,
                          description: entry.description,
                          task: entry.task,
                          projectId: entry.project.id,
                          activityId: entry.activity?.id,
                        }}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TimeEntryDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar registro de horas?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Eliminar entrada de {entry.hours}h en{" "}
                              {entry.project.name} del{" "}
                              {formatDate(entry.date)}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {filteredEntries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canEditAny ? 8 : 7}
                className="text-center py-8"
              >
                <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">
                      No hay registros para este periodo
                    </p>
                    <Button variant="link" className="mt-2" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Empeza a registrar tus horas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cada dia, registra las tareas que realizaste y el tiempo invertido.
                    </p>
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
