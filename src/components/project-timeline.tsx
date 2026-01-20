"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  client: { name: string };
  phases: {
    id: string;
    name: string;
    type: string;
    startDate: Date | null;
    endDate: Date | null;
  }[];
}

interface ProjectTimelineProps {
  projects: Project[];
}

const statusColors: Record<string, string> = {
  PLANIFICACION: "bg-blue-500",
  EN_PROGRESO: "bg-green-500",
  PAUSADO: "bg-yellow-500",
  COMPLETADO: "bg-emerald-500",
  CANCELADO: "bg-red-500",
};

const phaseColors: Record<string, string> = {
  PREPARE: "bg-slate-400",
  CONNECT: "bg-blue-400",
  REALIZE: "bg-purple-400",
  RUN: "bg-green-400",
};

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  // Calculate timeline range based on project dates
  const { startDate, endDate, months, totalDays } = useMemo(() => {
    const projectsWithDates = projects.filter((p) => p.startDate);

    if (projectsWithDates.length === 0) {
      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(addDays(today, 90));
      return {
        startDate: start,
        endDate: end,
        months: eachMonthOfInterval({ start, end }),
        totalDays: differenceInDays(end, start),
      };
    }

    const allStartDates = projectsWithDates.map((p) => new Date(p.startDate!));
    const allEndDates = projectsWithDates
      .filter((p) => p.endDate)
      .map((p) => new Date(p.endDate!));

    const minDate = startOfMonth(new Date(Math.min(...allStartDates.map((d) => d.getTime()))));
    const maxDate = endOfMonth(
      allEndDates.length > 0
        ? new Date(Math.max(...allEndDates.map((d) => d.getTime())))
        : addDays(new Date(Math.max(...allStartDates.map((d) => d.getTime()))), 90)
    );

    return {
      startDate: minDate,
      endDate: maxDate,
      months: eachMonthOfInterval({ start: minDate, end: maxDate }),
      totalDays: differenceInDays(maxDate, minDate),
    };
  }, [projects]);

  const getPositionAndWidth = (projectStart: Date | null, projectEnd: Date | null) => {
    if (!projectStart) return { left: 0, width: 0, visible: false };

    const start = new Date(projectStart);
    const end = projectEnd ? new Date(projectEnd) : addDays(start, 30);

    const leftDays = Math.max(0, differenceInDays(start, startDate));
    const durationDays = differenceInDays(end, start);

    return {
      left: (leftDays / totalDays) * 100,
      width: Math.max(2, (durationDays / totalDays) * 100),
      visible: true,
    };
  };

  const projectsWithPositions = useMemo(() => {
    return projects.map((project) => {
      const position = getPositionAndWidth(project.startDate, project.endDate);
      const phasesWithPositions = project.phases
        .filter((phase) => phase.type !== "PREPARE")
        .map((phase) => ({
          ...phase,
          position: getPositionAndWidth(phase.startDate, phase.endDate),
        }));
      return { ...project, position, phasesWithPositions };
    });
  }, [projects, startDate, totalDays]);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay proyectos para mostrar en el timeline
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="flex border-b pb-2 mb-4">
                <div className="w-48 shrink-0" />
                <div className="flex-1 flex">
                  {months.map((month, index) => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    const monthDays = differenceInDays(monthEnd, monthStart) + 1;
                    const width = (monthDays / totalDays) * 100;

                    return (
                      <div
                        key={index}
                        className="text-sm font-medium text-center border-l first:border-l-0"
                        style={{ width: `${width}%` }}
                      >
                        {format(month, "MMM yyyy", { locale: es })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-4">
                {projectsWithPositions.map((project) => (
                  <div key={project.id} className="flex items-center">
                    {/* Project info */}
                    <div className="w-48 shrink-0 pr-4">
                      <Link
                        href={`/dashboard/proyectos/${project.id}`}
                        className="block hover:underline"
                      >
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project.client.name}
                        </p>
                      </Link>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative h-10 bg-slate-100 dark:bg-slate-800 rounded">
                      {project.position.visible && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/dashboard/proyectos/${project.id}`}
                              className={`absolute h-full rounded ${statusColors[project.status]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                              style={{
                                left: `${project.position.left}%`,
                                width: `${project.position.width}%`,
                              }}
                            >
                              {/* Phase segments */}
                              <div className="h-full flex">
                                {project.phasesWithPositions.map((phase) => {
                                  if (!phase.position.visible) return null;
                                  const relativeLeft =
                                    ((phase.position.left - project.position.left) /
                                      project.position.width) *
                                    100;
                                  const relativeWidth =
                                    (phase.position.width / project.position.width) * 100;

                                  return (
                                    <div
                                      key={phase.id}
                                      className={`absolute h-2 bottom-0 ${phaseColors[phase.type]} rounded-b`}
                                      style={{
                                        left: `${Math.max(0, relativeLeft)}%`,
                                        width: `${Math.min(100, relativeWidth)}%`,
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs">
                                {project.startDate
                                  ? format(new Date(project.startDate), "dd MMM yyyy", {
                                      locale: es,
                                    })
                                  : "Sin fecha"}{" "}
                                -{" "}
                                {project.endDate
                                  ? format(new Date(project.endDate), "dd MMM yyyy", {
                                      locale: es,
                                    })
                                  : "En curso"}
                              </p>
                              <Badge
                                variant="secondary"
                                className={`${statusColors[project.status]} text-white text-xs`}
                              >
                                {project.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-6 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estados:</span>
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded ${color}`} />
                      <span className="text-xs text-muted-foreground">
                        {status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fases SAM:</span>
                  {Object.entries(phaseColors)
                    .filter(([type]) => type !== "PREPARE")
                    .map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${color}`} />
                        <span className="text-xs text-muted-foreground">{type}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
