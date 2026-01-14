"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { addDays, format, differenceInDays, isWeekend, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, ChevronRight, Circle, AlertTriangle, Pause, RefreshCw, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getParticipationColor, getParticipationLabel } from "@/lib/project-template";
import { ActivityEditDialog } from "./activity-edit-dialog";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
} from "@dnd-kit/core";
import { updateActivityDates } from "@/app/(dashboard)/dashboard/proyectos/actions";
import { addWorkingDays } from "@/lib/date-utils";

interface Activity {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  progress: number;
  participationType: string;
}

interface Phase {
  id: string;
  name: string;
  type: string;
  order: number;
  activities: Activity[];
}

interface Holiday {
  date: Date;
  name: string;
}

interface ActiveBlocker {
  id: string;
  title: string;
  type: string;
}

interface BlockerPeriod {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  impactDays: number | null;
  isResolved: boolean;
  category: "BLOCKER" | "PAUSE";
}

interface GanttChartProps {
  phases: Phase[];
  startDate: Date;
  holidays: Holiday[];
  projectStatus?: string;
  activeBlockers?: ActiveBlocker[];
  blockerPeriods?: BlockerPeriod[];
  projectId?: string;
  userRole?: string;
  onRecalculateDates?: (daysToAdd: number) => Promise<void>;
}

// Colores de participación (definidos aquí para uso en componentes internos)
const participationColors: Record<string, string> = {
  PREVIO_KICKOFF: "bg-orange-500",
  CLIENTE: "bg-green-400",
  SEIDOR: "bg-blue-500",
  RECUPERADOS: "bg-yellow-400",
  FIN_PROYECTO: "bg-purple-600",
};

// Componente de barra arrastrable con redimensionamiento
interface DraggableActivityBarProps {
  activity: Activity;
  barPosition: { left: number; width: number };
  isDragDisabled: boolean;
  onEdit: (activity: Activity) => void;
  onResize: (activityId: string, edge: "left" | "right", daysDelta: number) => void;
  cellWidth: number;
}

function DraggableActivityBar({
  activity,
  barPosition,
  isDragDisabled,
  onEdit,
  onResize,
  cellWidth,
}: DraggableActivityBarProps) {
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [resizeDelta, setResizeDelta] = useState(0);
  const startXRef = React.useRef(0);
  const originalWidthRef = React.useRef(0);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { activity, originalPosition: barPosition },
    disabled: isDragDisabled || isResizing !== null,
  });

  // Handlers de resize
  const handleResizeStart = (e: React.MouseEvent, edge: "left" | "right") => {
    if (isDragDisabled) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(edge);
    startXRef.current = e.clientX;
    originalWidthRef.current = barPosition.width;
    setResizeDelta(0);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const daysDelta = Math.round(deltaX / cellWidth);
      setResizeDelta(daysDelta);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startXRef.current;
      const daysDelta = Math.round(deltaX / cellWidth);

      if (daysDelta !== 0) {
        onResize(activity.id, edge, daysDelta);
      }

      setIsResizing(null);
      setResizeDelta(0);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Calcular estilos con resize
  // Solo aplicar transform del drag cuando NO estamos redimensionando
  let adjustedLeft = barPosition.left + 2;
  let adjustedWidth = barPosition.width;

  if (isResizing === "left") {
    // Redimensionando desde la izquierda: mover el inicio
    adjustedLeft += resizeDelta * cellWidth;
    adjustedWidth -= resizeDelta * cellWidth;
  } else if (isResizing === "right") {
    // Redimensionando desde la derecha: solo cambiar el ancho, NO el left
    adjustedWidth += resizeDelta * cellWidth;
  } else if (transform?.x) {
    // Solo aplicar transform del drag cuando no estamos redimensionando
    adjustedLeft += transform.x;
  }

  // Asegurar ancho mínimo de 1 día
  adjustedWidth = Math.max(adjustedWidth, cellWidth - 4);

  const style: React.CSSProperties = {
    left: adjustedLeft,
    width: adjustedWidth,
    opacity: isDragging || isResizing ? 0.7 : 1,
    cursor: isDragDisabled ? "pointer" : isDragging ? "grabbing" : "grab",
    zIndex: isDragging || isResizing ? 50 : 1,
  };

  // Calcular nueva duración para mostrar en tooltip
  const currentDuration = isResizing
    ? Math.max(1, activity.durationDays + (isResizing === "right" ? resizeDelta : -resizeDelta))
    : activity.durationDays;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          {...attributes}
          {...(isResizing ? {} : listeners)}
          className={cn(
            "absolute top-1 h-7 rounded-sm transition-shadow group",
            participationColors[activity.participationType] || "bg-gray-400",
            (isDragging || isResizing) && "ring-2 ring-primary shadow-lg",
            !isDragDisabled && !isResizing && "hover:ring-1 hover:ring-primary/50"
          )}
          style={style}
          onClick={(e) => {
            if (!isDragging && !isResizing) {
              e.stopPropagation();
              onEdit(activity);
            }
          }}
        >
          {/* Handle de resize izquierdo */}
          {!isDragDisabled && (
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity z-10 rounded-l-sm"
              onMouseDown={(e) => handleResizeStart(e, "left")}
              title="Arrastrar para cambiar fecha inicio"
            />
          )}

          {/* Barra de progreso dentro */}
          {activity.progress > 0 && activity.progress < 100 && (
            <div
              className="absolute top-0 left-0 h-full bg-black/20 rounded-l-sm pointer-events-none"
              style={{ width: `${activity.progress}%` }}
            />
          )}

          {/* Indicador de drag en el centro */}
          {!isDragDisabled && (
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <GripVertical className="h-3 w-3 text-white/70" />
            </div>
          )}

          {/* Handle de resize derecho */}
          {!isDragDisabled && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity z-10 rounded-r-sm"
              onMouseDown={(e) => handleResizeStart(e, "right")}
              title="Arrastrar para cambiar duracion"
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{activity.name}</p>
          <p className="text-xs">
            {activity.startDate && format(new Date(activity.startDate), "dd/MM/yyyy")}
            {" - "}
            {activity.endDate && format(new Date(activity.endDate), "dd/MM/yyyy")}
          </p>
          <p className="text-xs">
            Duracion: {currentDuration} {currentDuration === 1 ? "dia" : "dias"}
            {isResizing && resizeDelta !== 0 && (
              <span className={cn(
                "ml-1 font-bold",
                (isResizing === "right" ? resizeDelta : -resizeDelta) > 0 ? "text-amber-500" : "text-green-500"
              )}>
                ({(isResizing === "right" ? resizeDelta : -resizeDelta) > 0 ? "+" : ""}{isResizing === "right" ? resizeDelta : -resizeDelta})
              </span>
            )}
          </p>
          {!isDragDisabled && !isResizing && (
            <p className="text-xs text-primary font-medium">Arrastra centro para mover, bordes para redimensionar</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Componente de preview durante el drag
function DragPreview({
  activity,
  daysOffset,
  originalStartDate,
  originalEndDate
}: {
  activity: Activity;
  daysOffset: number;
  originalStartDate: Date;
  originalEndDate: Date;
}) {
  const newStart = addDays(originalStartDate, daysOffset);
  const newEnd = addDays(originalEndDate, daysOffset);

  return (
    <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[200px]">
      <p className="font-medium text-sm text-foreground truncate">{activity.name}</p>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-muted-foreground">
          {format(newStart, "dd/MM/yyyy")} - {format(newEnd, "dd/MM/yyyy")}
        </p>
        <p className={cn(
          "text-sm font-bold",
          daysOffset > 0 ? "text-amber-500" : daysOffset < 0 ? "text-green-500" : "text-muted-foreground"
        )}>
          {daysOffset === 0 ? "Sin cambio" : `${daysOffset > 0 ? "+" : ""}${daysOffset} dias`}
        </p>
      </div>
    </div>
  );
}

const CELL_WIDTH = 42;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;

export function GanttChart({
  phases,
  startDate,
  holidays,
  projectStatus,
  activeBlockers = [],
  blockerPeriods = [],
  projectId,
  userRole,
  onRecalculateDates,
}: GanttChartProps) {
  const router = useRouter();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.map((p) => p.id))
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Estado para drag-and-drop
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [currentDragOffset, setCurrentDragOffset] = useState(0);

  // Configurar sensores de drag (activar despues de 8px de movimiento)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Verificar si el usuario puede arrastrar
  const canDrag = userRole === "MANAGER" || userRole === "ARQUITECTO_RPA";
  const isDragDisabled = !canDrag || projectStatus === "PAUSADO" || activeBlockers.length > 0;

  // Calcular días de impacto pendientes de recalcular
  const pendingImpactDays = useMemo(() => {
    return blockerPeriods
      .filter((b) => b.isResolved && b.impactDays && b.impactDays > 0)
      .reduce((sum, b) => sum + (b.impactDays || 0), 0);
  }, [blockerPeriods]);

  const handleRecalculate = async () => {
    if (!onRecalculateDates || pendingImpactDays === 0) return;
    setIsRecalculating(true);
    try {
      await onRecalculateDates(pendingImpactDays);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Funcion para abrir el dialog de edicion
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditDialogOpen(true);
  };

  // Handlers para drag-and-drop
  const handleDragStart = (event: DragStartEvent) => {
    const { activity } = event.active.data.current as { activity: Activity };
    setDraggedActivity(activity);
    setCurrentDragOffset(0);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (event.delta) {
      const daysOffset = Math.round(event.delta.x / CELL_WIDTH);
      setCurrentDragOffset(daysOffset);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!delta || !draggedActivity) {
      setDraggedActivity(null);
      setCurrentDragOffset(0);
      return;
    }

    const { activity } = active.data.current as { activity: Activity };

    setDraggedActivity(null);
    setCurrentDragOffset(0);

    // Ignorar movimientos pequeños (menos de medio día)
    if (Math.abs(delta.x) < CELL_WIDTH / 2) return;

    // Calcular días de offset
    const daysOffset = Math.round(delta.x / CELL_WIDTH);
    if (daysOffset === 0) return;

    // Verificar que la actividad tiene fechas
    if (!activity.startDate || !activity.endDate) {
      toast({
        title: "Error",
        description: "La actividad no tiene fechas definidas",
        variant: "destructive",
      });
      return;
    }

    // Calcular nuevas fechas (usando días calendario, no laborales para simplificar)
    const newStartDate = addDays(new Date(activity.startDate), daysOffset);
    const newEndDate = addDays(new Date(activity.endDate), daysOffset);

    try {
      await updateActivityDates(activity.id, newStartDate, newEndDate);
      toast({
        title: "Fechas actualizadas",
        description: `Actividad movida ${daysOffset > 0 ? "+" : ""}${daysOffset} dias`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las fechas. Verifica tus permisos.",
        variant: "destructive",
      });
    }
  };

  const handleDragCancel = () => {
    setDraggedActivity(null);
    setCurrentDragOffset(0);
  };

  // Handler para redimensionar actividades
  const handleResize = async (activityId: string, edge: "left" | "right", daysDelta: number) => {
    // Buscar la actividad
    let targetActivity: Activity | null = null;
    for (const phase of phases) {
      const found = phase.activities.find(a => a.id === activityId);
      if (found) {
        targetActivity = found;
        break;
      }
    }

    if (!targetActivity || !targetActivity.startDate || !targetActivity.endDate) {
      toast({
        title: "Error",
        description: "No se pudo encontrar la actividad",
        variant: "destructive",
      });
      return;
    }

    let newStartDate = new Date(targetActivity.startDate);
    let newEndDate = new Date(targetActivity.endDate);

    if (edge === "left") {
      // Mover fecha de inicio
      newStartDate = addDays(newStartDate, daysDelta);
      // Verificar que no termine después de la fecha de fin
      if (newStartDate >= newEndDate) {
        toast({
          title: "Error",
          description: "La fecha de inicio no puede ser mayor o igual a la de fin",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Mover fecha de fin
      newEndDate = addDays(newEndDate, daysDelta);
      // Verificar que no termine antes de la fecha de inicio
      if (newEndDate <= newStartDate) {
        toast({
          title: "Error",
          description: "La fecha de fin no puede ser menor o igual a la de inicio",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await updateActivityDates(activityId, newStartDate, newEndDate);
      const newDuration = differenceInDays(newEndDate, newStartDate) + 1;
      toast({
        title: "Duracion actualizada",
        description: `Nueva duracion: ${newDuration} ${newDuration === 1 ? "dia" : "dias"}`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la duracion. Verifica tus permisos.",
        variant: "destructive",
      });
    }
  };

  // Calcular el rango de fechas del proyecto
  const { dateRange, totalDays } = useMemo(() => {
    let minDate = new Date(startDate);
    let maxDate = new Date(startDate);

    phases.forEach((phase) => {
      phase.activities.forEach((activity) => {
        if (activity.startDate && activity.startDate < minDate) {
          minDate = new Date(activity.startDate);
        }
        if (activity.endDate && activity.endDate > maxDate) {
          maxDate = new Date(activity.endDate);
        }
      });
    });

    // Agregar margen de días
    minDate = addDays(minDate, -2);
    maxDate = addDays(maxDate, 5);

    const totalDays = differenceInDays(maxDate, minDate) + 1;

    return {
      dateRange: { start: minDate, end: maxDate },
      totalDays: Math.max(totalDays, 30), // Mínimo 30 días
    };
  }, [phases, startDate]);

  // Generar columnas de fechas
  const dateColumns = useMemo(() => {
    const columns = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(dateRange.start, i);
      const holiday = holidays.find((h) => isSameDay(new Date(h.date), date));
      columns.push({
        date,
        dayNumber: i + 1,
        dayOfWeek: format(date, "EEE", { locale: es }),
        dateFormatted: format(date, "dd/MM", { locale: es }),
        isWeekend: isWeekend(date),
        isHoliday: !!holiday,
        holidayName: holiday?.name,
      });
    }
    return columns;
  }, [dateRange.start, totalDays, holidays]);

  // Calcular posicion del dia actual
  const todayPosition = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIndex = differenceInDays(today, dateRange.start);
    const isVisible = todayIndex >= 0 && todayIndex < totalDays;
    return {
      index: todayIndex,
      isVisible,
      left: todayIndex * CELL_WIDTH + CELL_WIDTH / 2,
    };
  }, [dateRange.start, totalDays]);

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getBarPosition = (activity: Activity) => {
    if (!activity.startDate || !activity.endDate) {
      return null;
    }

    const startOffset = differenceInDays(
      new Date(activity.startDate),
      dateRange.start
    );
    const duration =
      differenceInDays(new Date(activity.endDate), new Date(activity.startDate)) + 1;

    return {
      left: startOffset * CELL_WIDTH,
      width: duration * CELL_WIDTH - 4,
    };
  };

  // Calcular posicion de las barras de bloqueo
  const getBlockerBarPosition = (blocker: BlockerPeriod) => {
    const startOffset = differenceInDays(
      new Date(blocker.startDate),
      dateRange.start
    );

    // Calcular duración: usar impactDays si está disponible, sino calcular desde fechas
    let duration: number;
    if (blocker.impactDays && blocker.impactDays > 0) {
      // Usar los días de impacto definidos
      duration = blocker.impactDays;
    } else if (blocker.endDate) {
      // Si está resuelto y no tiene impactDays, calcular desde las fechas reales
      duration = differenceInDays(new Date(blocker.endDate), new Date(blocker.startDate)) + 1;
    } else {
      // Blocker activo sin impactDays: mostrar hasta hoy
      duration = differenceInDays(new Date(), new Date(blocker.startDate)) + 1;
    }

    // Mínimo 1 día de duración
    duration = Math.max(1, duration);

    // Solo mostrar si esta dentro del rango visible
    if (startOffset + duration < 0 || startOffset > totalDays) {
      return null;
    }

    return {
      left: Math.max(0, startOffset * CELL_WIDTH),
      width: Math.min(duration * CELL_WIDTH, (totalDays - Math.max(0, startOffset)) * CELL_WIDTH),
    };
  };

  // Calcular altura total del contenido del Gantt
  const totalContentHeight = useMemo(() => {
    let height = 0;
    phases.forEach((phase) => {
      height += ROW_HEIGHT; // Fila de fase
      if (expandedPhases.has(phase.id)) {
        height += phase.activities.length * ROW_HEIGHT;
      }
    });
    return height;
  }, [phases, expandedPhases]);

  const statusLabels: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PROGRESO: "En Progreso",
    COMPLETADO: "Completado",
    BLOQUEADO: "Bloqueado",
  };

  const isPaused = projectStatus === "PAUSADO";
  const hasBlockers = activeBlockers.length > 0;

  // Detectar pausas activas desde blockerPeriods
  const activePauses = blockerPeriods.filter(
    (p) => p.category === "PAUSE" && !p.isResolved
  );
  const hasPauses = activePauses.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <TooltipProvider>
        <div className="space-y-4">
          {/* Alerta de estado bloqueado */}
        {hasBlockers && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              Proyecto Bloqueado ({activeBlockers.length} blocker{activeBlockers.length > 1 ? "s" : ""} activo{activeBlockers.length > 1 ? "s" : ""})
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-1 text-sm">
                {activeBlockers.slice(0, 3).map((blocker) => (
                  <li key={blocker.id}>• {blocker.title}</li>
                ))}
                {activeBlockers.length > 3 && (
                  <li>• y {activeBlockers.length - 3} mas...</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de estado pausado */}
        {(hasPauses || (isPaused && !hasBlockers)) && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <Pause className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">
              {hasPauses
                ? `Proyecto en Pausa (${activePauses.length} pausa${activePauses.length > 1 ? "s" : ""} activa${activePauses.length > 1 ? "s" : ""})`
                : "Proyecto Pausado"}
            </AlertTitle>
            <AlertDescription className="text-amber-400">
              {hasPauses ? (
                <ul className="mt-1 text-sm">
                  {activePauses.slice(0, 3).map((pause) => (
                    <li key={pause.id}>• {pause.title}</li>
                  ))}
                  {activePauses.length > 3 && (
                    <li>• y {activePauses.length - 3} mas...</li>
                  )}
                </ul>
              ) : (
                "El proyecto está pausado. No se puede avanzar hasta que se reactive."
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de recalcular fechas cuando hay blockers resueltos con impacto */}
        {pendingImpactDays > 0 && onRecalculateDates && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <RefreshCw className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">
              Fechas pendientes de ajustar
            </AlertTitle>
            <AlertDescription className="text-amber-400">
              <div className="flex items-center justify-between">
                <span>
                  Los blockers resueltos tienen un impacto total de{" "}
                  <strong>{pendingImpactDays} dias</strong>. Puedes recalcular las
                  fechas de las actividades pendientes.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 border-amber-500/50 hover:bg-amber-500/20"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                >
                  {isRecalculating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Recalculando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recalcular (+{pendingImpactDays} dias)
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-auto border rounded-lg">
        <div className="flex">
          {/* Columna izquierda - Actividades */}
          <div className="flex-shrink-0 w-[400px] border-r bg-card z-10 sticky left-0">
            {/* Header */}
            <div
              className="flex items-center border-b bg-muted font-medium text-foreground"
              style={{ height: HEADER_HEIGHT }}
            >
              <div className="px-4">Actividades por Fase</div>
            </div>

            {/* Filas */}
            {phases.map((phase) => (
              <div key={phase.id}>
                {/* Fila de Fase */}
                <div
                  className="flex items-center border-b bg-muted/50 cursor-pointer hover:bg-muted text-foreground"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="px-2">
                    {expandedPhases.has(phase.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    {phase.order}. {phase.name}
                  </span>
                </div>

                {/* Actividades */}
                {expandedPhases.has(phase.id) &&
                  phase.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-center border-b cursor-pointer transition-colors bg-card text-foreground",
                        selectedActivityId === activity.id
                          ? "bg-accent/20 hover:bg-accent/20"
                          : "hover:bg-muted/50"
                      )}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => {
                        setSelectedActivityId(activity.id);
                        handleEditActivity(activity);
                      }}
                    >
                      <div className="px-4 flex items-center gap-2 w-full">
                        <span className="text-xs text-muted-foreground w-12">
                          {activity.code}
                        </span>
                        <span className="text-sm truncate flex-1" title={activity.name}>
                          {activity.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            activity.status === "COMPLETADO" && "bg-green-100",
                            activity.status === "EN_PROGRESO" && "bg-blue-100"
                          )}
                        >
                          {activity.progress}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Columna derecha - Gantt */}
          <div className="flex-1 min-w-0 relative">
            {/* Barras de periodos bloqueados/pausados */}
            {blockerPeriods.map((period) => {
              const barPosition = getBlockerBarPosition(period);
              if (!barPosition) return null;

              const isBlocker = period.category === "BLOCKER";
              const isPause = period.category === "PAUSE";

              // Colores según categoría
              const bgColor = isBlocker
                ? period.isResolved
                  ? "bg-red-200/40"
                  : "bg-red-500/30"
                : period.isResolved
                  ? "bg-amber-200/40"
                  : "bg-amber-500/30";

              const stripeColor = isBlocker
                ? period.isResolved
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.2)"
                : period.isResolved
                  ? "rgba(245, 158, 11, 0.1)"
                  : "rgba(245, 158, 11, 0.2)";

              const labelBgColor = isBlocker ? "bg-red-600" : "bg-amber-600";
              const titleColor = isBlocker ? "text-red-600" : "text-amber-600";

              const statusLabel = isBlocker
                ? period.isResolved
                  ? "Resuelto"
                  : "Bloqueado"
                : period.isResolved
                  ? "Reanudado"
                  : "Pausado";

              const typeLabel = isBlocker ? "Blocker" : "Pausa";

              return (
                <Tooltip key={period.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute z-10 pointer-events-auto cursor-help",
                        bgColor
                      )}
                      style={{
                        left: barPosition.left,
                        width: barPosition.width,
                        top: HEADER_HEIGHT,
                        height: totalContentHeight,
                      }}
                    >
                      {/* Patron de rayas diagonales */}
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${stripeColor} 10px, ${stripeColor} 20px)`,
                        }}
                      />
                      {/* Etiqueta */}
                      <div className={cn("absolute top-2 left-2 text-white text-[10px] px-2 py-1 rounded font-medium whitespace-nowrap z-20 shadow-sm", labelBgColor)}>
                        {statusLabel}: {period.title.length > 20 ? period.title.substring(0, 20) + "..." : period.title}
                        {period.impactDays && period.impactDays > 0 && ` (${period.impactDays}d)`}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className={cn("font-semibold", titleColor)}>
                        {typeLabel} {period.isResolved ? "Resuelto" : "Activo"}
                      </p>
                      <p className="font-medium">{period.title}</p>
                      <p className="text-xs">
                        Inicio: {format(new Date(period.startDate), "dd/MM/yyyy")}
                      </p>
                      {period.endDate && (
                        <p className="text-xs">
                          Fin: {format(new Date(period.endDate), "dd/MM/yyyy")}
                        </p>
                      )}
                      {period.impactDays && period.impactDays > 0 && (
                        <p className="text-xs font-medium text-amber-600">
                          Impacto: {period.impactDays} dias
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Linea del dia actual */}
            {todayPosition.isVisible && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: todayPosition.left }}
              >
                <div className="absolute top-1 -left-4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                  Hoy
                </div>
              </div>
            )}

            {/* Header de fechas */}
            <div
              className="flex border-b bg-muted"
              style={{ height: HEADER_HEIGHT }}
            >
              {dateColumns.map((col, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 border-r flex flex-col items-center justify-center text-xs text-foreground",
                    col.isWeekend && "bg-muted-foreground/10",
                    col.isHoliday && "bg-red-500/20"
                  )}
                  style={{ width: CELL_WIDTH }}
                >
                  <span className="font-medium">{col.dayNumber}</span>
                  <span className="text-muted-foreground">{col.dateFormatted}</span>
                </div>
              ))}
            </div>

            {/* Filas del Gantt */}
            {phases.map((phase) => (
              <div key={phase.id}>
                {/* Fila de Fase (vacía en el Gantt) */}
                <div
                  className="flex border-b bg-muted/50"
                  style={{ height: ROW_HEIGHT }}
                >
                  {dateColumns.map((col, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-shrink-0 border-r",
                        col.isWeekend && "bg-muted-foreground/10",
                        col.isHoliday && "bg-red-500/10"
                      )}
                      style={{ width: CELL_WIDTH }}
                    />
                  ))}
                </div>

                {/* Actividades */}
                {expandedPhases.has(phase.id) &&
                  phase.activities.map((activity) => {
                    const barPosition = getBarPosition(activity);
                    const isSelected = selectedActivityId === activity.id;

                    return (
                      <div
                        key={activity.id}
                        className={cn(
                          "flex border-b relative cursor-pointer transition-colors bg-card",
                          isSelected && "bg-accent/10"
                        )}
                        style={{ height: ROW_HEIGHT }}
                        onClick={() => {
                          setSelectedActivityId(activity.id);
                          handleEditActivity(activity);
                        }}
                      >
                        {/* Grid de celdas */}
                        {dateColumns.map((col, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-shrink-0 border-r",
                              isSelected
                                ? "bg-accent/10"
                                : col.isWeekend
                                ? "bg-muted/30"
                                : col.isHoliday && "bg-red-500/10"
                            )}
                            style={{ width: CELL_WIDTH }}
                          />
                        ))}

                        {/* Barra de actividad arrastrable */}
                        {barPosition && activity.durationDays > 0 && (
                          <DraggableActivityBar
                            activity={activity}
                            barPosition={barPosition}
                            isDragDisabled={isDragDisabled}
                            onEdit={handleEditActivity}
                            onResize={handleResize}
                            cellWidth={CELL_WIDTH}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-6 p-4 border-t bg-muted/50">
          <span className="text-sm font-medium text-foreground">Leyenda:</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-orange-500" />
              <span className="text-xs text-muted-foreground">Previo al Kick Off</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-green-400" />
              <span className="text-xs text-muted-foreground">Participacion Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-blue-500" />
              <span className="text-xs text-muted-foreground">Seidor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-yellow-400" />
              <span className="text-xs text-muted-foreground">Dias Recuperados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-purple-600" />
              <span className="text-xs text-muted-foreground">Fin del Proyecto</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Dialog de edicion de actividad */}
      <ActivityEditDialog
        activity={editingActivity}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </TooltipProvider>

    {/* Overlay de drag con preview */}
    <DragOverlay>
      {draggedActivity && draggedActivity.startDate && draggedActivity.endDate && (
        <DragPreview
          activity={draggedActivity}
          daysOffset={currentDragOffset}
          originalStartDate={new Date(draggedActivity.startDate)}
          originalEndDate={new Date(draggedActivity.endDate)}
        />
      )}
    </DragOverlay>
    </DndContext>
  );
}
