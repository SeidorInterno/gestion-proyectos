"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  MoreHorizontal,
  Eye,
  Pencil,
  UserPlus,
  MessageSquare,
  Clock,
  Lock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateTicketStage } from "./actions";
import { TicketDialog } from "./ticket-dialog";
import {
  TICKET_STAGES,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  getValidTransitions,
  type TicketStageKey,
} from "@/lib/support-utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TicketStage, TicketType, TicketPriority } from "@prisma/client";

interface Flow {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  stage: TicketStage;
  type: TicketType;
  priority: TicketPriority;
  flowId: string | null;
  flow: { id: string; name: string } | null;
  screenshotUrl: string | null;
  excelUrl: string | null;
  incidentDate: Date | null;
  reporterEmail: string;
  ccEmails: string | null;
  estimatedHours: number | null;
  assignedTo: { id: string; name: string } | null;
  assignedToId: string | null;
  createdBy: { id: string; name: string };
  createdAt: Date;
  _count: { comments: number; timeEntries: number };
}

interface ClientProject {
  id: string;
  name: string;
  clientId: string;
}

interface TicketsKanbanProps {
  tickets: Ticket[];
  poolId: string;
  flows: Flow[];
  users: User[];
  clientProjects?: ClientProject[];
}

const KANBAN_COLUMNS: TicketStageKey[] = [
  "BACKLOG",
  "EVALUACION",
  "EN_ESPERA",
  "ATENDIENDO",
  "ATENDIDO",
  "CANCELADO",
];

function TicketCard({
  ticket,
  isDragging,
  poolId,
  flows,
  users,
  clientProjects = [],
}: {
  ticket: Ticket;
  isDragging?: boolean;
  poolId: string;
  flows: Flow[];
  users: User[];
  clientProjects?: ClientProject[];
}) {
  const priorityConfig = TICKET_PRIORITIES[ticket.priority];
  const typeConfig = TICKET_TYPES[ticket.type];

  return (
    <Card
      className={cn(
        "cursor-grab group transition-shadow",
        isDragging && "opacity-50 shadow-lg",
        ticket.priority === "ALTA" && "border-l-4 border-l-red-500"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <Link
                href={`/dashboard/soporte/${poolId}/${ticket.id}`}
                className="font-medium text-sm hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {ticket.code}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/soporte/${poolId}/${ticket.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalle
                    </Link>
                  </DropdownMenuItem>
                  <TicketDialog
                    poolId={poolId}
                    flows={flows}
                    users={users}
                    ticket={ticket}
                    clientProjects={clientProjects}
                  >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  </TicketDialog>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Asignarme
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title */}
            <p className="text-sm truncate mb-2">{ticket.title}</p>

            {/* Flow */}
            {ticket.flow && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {ticket.flow.name}
              </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <span
                  className={cn("w-2 h-2 rounded-full mr-1", priorityConfig.color)}
                />
                {priorityConfig.label}
              </Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(ticket.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              <div className="flex items-center gap-2">
                {ticket._count.comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {ticket._count.comments}
                  </span>
                )}
                {ticket._count.timeEntries > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ticket._count.timeEntries}
                  </span>
                )}
              </div>
            </div>

            {/* Assignee */}
            {ticket.assignedTo && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  👤 {ticket.assignedTo.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableTicketCard({
  ticket,
  poolId,
  flows,
  users,
  clientProjects = [],
}: {
  ticket: Ticket;
  poolId: string;
  flows: Flow[];
  users: User[];
  clientProjects?: ClientProject[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard
        ticket={ticket}
        isDragging={isDragging}
        poolId={poolId}
        flows={flows}
        users={users}
        clientProjects={clientProjects}
      />
    </div>
  );
}

function KanbanColumn({
  stage,
  tickets,
  poolId,
  flows,
  users,
  clientProjects = [],
  isDraggingActive,
  isValidTarget,
  isCurrentColumn,
}: {
  stage: TicketStageKey;
  tickets: Ticket[];
  poolId: string;
  flows: Flow[];
  users: User[];
  clientProjects?: ClientProject[];
  isDraggingActive: boolean;
  isValidTarget: boolean;
  isCurrentColumn: boolean;
}) {
  const config = TICKET_STAGES[stage];

  // useDroppable para permitir soltar en columnas vacías
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  // Ordenar por prioridad (ALTA primero)
  const sortedTickets = [...tickets].sort((a, b) => {
    const priorityOrder = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Determinar estado visual de la columna
  const showBlocked = isDraggingActive && !isValidTarget && !isCurrentColumn;
  const showAllowed = isDraggingActive && isValidTarget && !isCurrentColumn;

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-3 h-3 rounded-full", config.color)} />
        <h3 className="font-semibold text-sm">{config.label}</h3>
        {showBlocked && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
        <Badge variant="secondary" className="ml-auto">
          {tickets.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2 min-h-[400px] transition-all",
          // Columna actual (donde está el ticket)
          isCurrentColumn && isDraggingActive && "ring-2 ring-blue-400/50",
          // Columna válida para soltar
          showAllowed && "ring-2 ring-green-500/50 bg-green-50 dark:bg-green-950/20",
          // Columna bloqueada
          showBlocked && "opacity-50 ring-2 ring-red-500/30 bg-red-50 dark:bg-red-950/20",
          // Hover sobre columna válida
          isOver && isValidTarget && "bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500",
          // Hover sobre columna bloqueada
          isOver && !isValidTarget && !isCurrentColumn && "ring-2 ring-red-500"
        )}
      >
        <SortableContext
          items={sortedTickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedTickets.map((ticket) => (
              <SortableTicketCard
                key={ticket.id}
                ticket={ticket}
                poolId={poolId}
                flows={flows}
                users={users}
                clientProjects={clientProjects}
              />
            ))}
          </div>
        </SortableContext>
        {tickets.length === 0 && (
          <p className={cn(
            "text-center text-sm py-8",
            showBlocked ? "text-red-400" : "text-muted-foreground"
          )}>
            {showBlocked ? "No permitido" : "Sin tickets"}
          </p>
        )}
      </div>
    </div>
  );
}

export function TicketsKanban({
  tickets: initialTickets,
  poolId,
  flows,
  users,
  clientProjects = [],
}: TicketsKanbanProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Evitar error de hidratación con dnd-kit
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Agrupar tickets por etapa
  const ticketsByStage = KANBAN_COLUMNS.reduce((acc, stage) => {
    acc[stage] = tickets.filter((t) => t.stage === stage);
    return acc;
  }, {} as Record<TicketStageKey, Ticket[]>);

  const activeTicket = activeId
    ? tickets.find((t) => t.id === activeId)
    : null;

  // Calcular transiciones válidas para el ticket activo
  const validTransitions = activeTicket
    ? getValidTransitions(activeTicket.stage as TicketStageKey)
    : [];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedTicket = tickets.find((t) => t.id === active.id);
    if (!draggedTicket) return;

    // Encontrar la columna destino
    let newStage: TicketStageKey | null = null;

    // Check if dropped on a column directly
    if (KANBAN_COLUMNS.includes(over.id as TicketStageKey)) {
      newStage = over.id as TicketStageKey;
    } else {
      // Find which column the target ticket belongs to
      const targetTicket = tickets.find((t) => t.id === over.id);
      if (targetTicket) {
        newStage = targetTicket.stage as TicketStageKey;
      }
    }

    // No hacer nada si es la misma columna
    if (!newStage || newStage === draggedTicket.stage) return;

    // Verificar si la transición es válida
    const allowedTransitions = getValidTransitions(draggedTicket.stage as TicketStageKey);
    if (!allowedTransitions.includes(newStage)) {
      toast({
        title: "Movimiento no permitido",
        description: `No se puede mover de "${TICKET_STAGES[draggedTicket.stage as TicketStageKey].label}" a "${TICKET_STAGES[newStage].label}"`,
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setTickets((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, stage: newStage as TicketStage } : t
      )
    );

    try {
      await updateTicketStage(active.id as string, newStage as TicketStage);
      toast({
        title: "Ticket movido",
        description: `Movido a "${TICKET_STAGES[newStage].label}"`,
      });
      // No hacer router.refresh() - el optimistic update ya actualizó la UI
      // y revalidatePath en el servidor invalida el cache para el próximo render
    } catch (error) {
      // Revert on error
      setTickets((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, stage: draggedTicket.stage } : t
        )
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo mover el ticket",
        variant: "destructive",
      });
    }
  };

  // Mostrar columnas sin drag hasta que se monte el cliente (evita error de hidratación)
  if (!isMounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            tickets={ticketsByStage[stage]}
            poolId={poolId}
            flows={flows}
            users={users}
            clientProjects={clientProjects}
            isDraggingActive={false}
            isValidTarget={false}
            isCurrentColumn={false}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            tickets={ticketsByStage[stage]}
            poolId={poolId}
            flows={flows}
            users={users}
            clientProjects={clientProjects}
            isDraggingActive={!!activeId}
            isValidTarget={validTransitions.includes(stage)}
            isCurrentColumn={activeTicket?.stage === stage}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <TicketCard
            ticket={activeTicket}
            isDragging
            poolId={poolId}
            flows={flows}
            users={users}
            clientProjects={clientProjects}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
