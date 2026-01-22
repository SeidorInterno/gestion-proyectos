"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FolderKanban, X } from "lucide-react";
import { ProjectActions } from "./project-actions";
import { ProjectDialog } from "./project-dialog";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  code: string | null;
  pep: string;
  description: string | null;
  status: string;
  tool: string;
  startDate: Date | null;
  endDate: Date;
  progress: number;
  currentPhase: string;
  clientId: string;
  managerId: string | null;
  progressStatus: {
    status: string;
    label: string;
  };
  client: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    name: string;
  } | null;
  _count: {
    assignments: number;
  };
}

interface ProjectsTableProps {
  projects: Project[];
}

const statusLabels: Record<string, string> = {
  PLANIFICACION: "Planificacion",
  EN_PROGRESO: "En Progreso",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

const toolLabels: Record<string, string> = {
  UIPATH: "UiPath",
  POWER_AUTOMATE: "Power Automate",
  POWER_APPS: "Power Apps",
  AUTOMATION_ANYWHERE: "Automation Anywhere",
  BLUE_PRISM: "Blue Prism",
  OTRO: "Otro",
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.pep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.manager?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      const matchesTool = toolFilter === "all" || project.tool === toolFilter;

      return matchesSearch && matchesStatus && matchesTool;
    });
  }, [projects, searchTerm, statusFilter, toolFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setToolFilter("all");
  };

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== "all" || toolFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, cliente, codigo, PEP o PM..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Herramienta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las herramientas</SelectItem>
            {Object.entries(toolLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredProjects.length} de {projects.length} proyectos
        </p>
      )}

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proyecto</TableHead>
            <TableHead>PEP</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Herramienta</TableHead>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Fin</TableHead>
            <TableHead>Fase Actual</TableHead>
            <TableHead>Avance</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>PM</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link
                  href={`/dashboard/proyectos/${project.id}`}
                  className="hover:underline"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.code && (
                      <p className="text-xs text-muted-foreground">
                        {project.code}
                      </p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {project.pep}
                </Badge>
              </TableCell>
              <TableCell>{project.client.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {toolLabels[project.tool] || project.tool}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {project.startDate ? formatDate(project.startDate) : "-"}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(project.endDate)}
              </TableCell>
              <TableCell>{project.currentPhase}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    project.progressStatus.status === "ahead"
                      ? "success"
                      : project.progressStatus.status === "behind"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {project.progressStatus.label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="w-16 h-2" />
                  <span className="text-sm text-muted-foreground">
                    {project.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>{project.manager?.name || "-"}</TableCell>
              <TableCell>
                <ProjectActions project={project} />
              </TableCell>
            </TableRow>
          ))}
          {filteredProjects.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8">
                <FolderKanban className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">
                      No se encontraron proyectos con los filtros aplicados
                    </p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={clearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      No hay proyectos registrados
                    </p>
                    <ProjectDialog>
                      <Button variant="link" className="mt-2">
                        Crear el primer proyecto
                      </Button>
                    </ProjectDialog>
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
