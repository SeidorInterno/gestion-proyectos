"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertOctagon,
  AlertTriangle,
  Shield,
  FileQuestion,
  Lightbulb,
  RefreshCw,
  Pause,
  GripVertical,
  Filter,
  Pencil,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateEventStatus } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { EventEditDialog } from "./event-dialog";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string | null;
  createdAt: Date;
  assignedToId?: string | null;
  project: {
    id: string;
    name: string;
    client: { name: string };
  };
  reportedBy: { name: string | null } | null;
  assignedTo: { name: string | null } | null;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
}

interface EventsKanbanProps {
  events: Event[];
  projects: Project[];
  users: User[];
}

const columns = [
  { id: "ABIERTO", title: "Abierto", color: "bg-blue-500" },
  { id: "EN_PROGRESO", title: "En Progreso", color: "bg-yellow-500" },
  { id: "RESUELTO", title: "Resuelto", color: "bg-green-500" },
  { id: "CERRADO", title: "Cerrado", color: "bg-slate-500" },
];

const categoryConfig: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  BLOCKER: { icon: AlertOctagon, color: "text-red-500 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800", label: "Blocker" },
  ISSUE: { icon: AlertTriangle, color: "text-orange-500 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800", label: "Issue" },
  RISK: { icon: Shield, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800", label: "Riesgo" },
  CHANGE: { icon: RefreshCw, color: "text-blue-500 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", label: "Cambio" },
  PAUSE: { icon: Pause, color: "text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700", label: "Pausa" },
  ABSENCE: { icon: FileQuestion, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800", label: "Ausencia" },
  MILESTONE: { icon: Lightbulb, color: "text-purple-500 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800", label: "Hito" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  CRITICO: { color: "bg-red-500", label: "Critica" },
  ALTO: { color: "bg-orange-500", label: "Alta" },
  MEDIO: { color: "bg-yellow-500", label: "Media" },
  BAJO: { color: "bg-green-500", label: "Baja" },
};

function EventCard({
  event,
  isDragging,
  onEdit,
}: {
  event: Event;
  isDragging?: boolean;
  onEdit?: () => void;
}) {
  const config = categoryConfig[event.category] || categoryConfig.ISSUE;
  const Icon = config.icon;
  const priority = event.priority ? priorityConfig[event.priority] : priorityConfig.MEDIO;

  return (
    <Card className={`mb-2 cursor-grab ${isDragging ? "opacity-50 shadow-lg" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${config.color.split(" ")[0]}`} />
                <span className="font-medium text-sm truncate">{event.title}</span>
              </div>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {event.project.name}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <span className={`w-2 h-2 rounded-full ${priority.color} mr-1`} />
                {priority.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableEventCard({
  event,
  onEdit,
}: {
  event: Event;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EventCard event={event} isDragging={isDragging} onEdit={onEdit} />
    </div>
  );
}

function KanbanColumn({
  column,
  events,
  onEditEvent,
}: {
  column: { id: string; title: string; color: string };
  events: Event[];
  onEditEvent: (event: Event) => void;
}) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${column.color}`} />
        <h3 className="font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {events.length}
        </Badge>
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 min-h-[400px]">
        <SortableContext
          items={events.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {events.map((event) => (
            <SortableEventCard
              key={event.id}
              event={event}
              onEdit={() => onEditEvent(event)}
            />
          ))}
        </SortableContext>
        {events.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Sin eventos
          </p>
        )}
      </div>
    </div>
  );
}

export function EventsKanban({ events: initialEvents, projects, users }: EventsKanbanProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      const matchesProject = projectFilter === "all" || event.project.id === projectFilter;
      return matchesCategory && matchesProject;
    });
  }, [events, categoryFilter, projectFilter]);

  const eventsByStatus = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = filteredEvents.filter((e) => e.status === col.id);
    });
    return grouped;
  }, [filteredEvents]);

  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeEvent = events.find((e) => e.id === active.id);
    if (!activeEvent) return;

    // Find which column the item was dropped on
    let newStatus: string | null = null;

    // Check if dropped directly on a column
    if (columns.some((col) => col.id === over.id)) {
      newStatus = over.id as string;
    } else {
      // Find which column the target item belongs to
      const targetEvent = events.find((e) => e.id === over.id);
      if (targetEvent) {
        newStatus = targetEvent.status;
      }
    }

    if (newStatus && newStatus !== activeEvent.status) {
      // Optimistically update the UI
      setEvents((prev) =>
        prev.map((e) =>
          e.id === active.id ? { ...e, status: newStatus! } : e
        )
      );

      try {
        await updateEventStatus(active.id as string, newStatus);
        toast({
          title: "Estado actualizado",
          description: `Evento movido a "${columns.find((c) => c.id === newStatus)?.title}"`,
        });
        router.refresh();
      } catch (error) {
        // Revert on error
        setEvents((prev) =>
          prev.map((e) =>
            e.id === active.id ? { ...e, status: activeEvent.status } : e
          )
        );
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del evento",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Badge variant="outline" className="ml-auto">
          {filteredEvents.length} evento(s)
        </Badge>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              events={eventsByStatus[column.id]}
              onEditEvent={setEditingEvent}
            />
          ))}
        </div>
        <DragOverlay>
          {activeEvent ? <EventCard event={activeEvent} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Dialog */}
      {editingEvent && (
        <EventEditDialog
          event={editingEvent}
          users={users}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
        />
      )}
    </div>
  );
}
