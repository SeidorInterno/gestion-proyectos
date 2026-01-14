"use client";

import { useState } from "react";
import { EventCard } from "./event-card";
import { EventDialog } from "./event-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Filter, AlertTriangle } from "lucide-react";
import { categoryConfig, statusConfig } from "./event-badge";

type Event = {
  id: string;
  category: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  startDate: Date;
  endDate: Date | null;
  dueDate: Date | null;
  impactDays: number | null;
  impactCost: number | null;
  assignedTo: { id: string; name: string } | null;
  reportedBy: { id: string; name: string };
  activity: { id: string; code: string; name: string } | null;
};

interface EventListProps {
  projectId: string;
  currentUserId: string;
  events: Event[];
  activities?: Array<{ id: string; code: string; name: string }>;
  users?: Array<{ id: string; name: string }>;
}

export function EventList({
  projectId,
  currentUserId,
  events,
  activities = [],
  users = [],
}: EventListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Filtrar eventos
  const filteredEvents = events.filter((event) => {
    if (categoryFilter !== "ALL" && event.category !== categoryFilter)
      return false;
    if (statusFilter !== "ALL" && event.status !== statusFilter) return false;
    return true;
  });

  // Contar eventos activos por categoría
  const activeBlockers = events.filter(
    (e) =>
      e.category === "BLOCKER" &&
      (e.status === "ABIERTO" || e.status === "EN_PROGRESO")
  ).length;

  const activeEvents = events.filter(
    (e) => e.status === "ABIERTO" || e.status === "EN_PROGRESO"
  ).length;

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeBlockers > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {activeBlockers} blocker{activeBlockers > 1 ? "s" : ""} activo
              {activeBlockers > 1 ? "s" : ""}
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {activeEvents} evento{activeEvents !== 1 ? "s" : ""} activo
            {activeEvents !== 1 ? "s" : ""}
          </span>
        </div>

        <EventDialog
          projectId={projectId}
          currentUserId={currentUserId}
          activities={activities}
          users={users}
        >
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </EventDialog>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrar:</span>
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(categoryFilter !== "ALL" || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryFilter("ALL");
              setStatusFilter("ALL");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Lista de eventos */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">No hay eventos</h3>
          <p className="text-muted-foreground mt-1">
            {events.length === 0
              ? "No se han registrado eventos para este proyecto"
              : "No hay eventos que coincidan con los filtros seleccionados"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={setEditingEvent}
            />
          ))}
        </div>
      )}

      {/* Dialog de edición */}
      {editingEvent && (
        <EventDialog
          projectId={projectId}
          currentUserId={currentUserId}
          activities={activities}
          users={users}
          editEvent={{
            id: editingEvent.id,
            category: editingEvent.category,
            type: editingEvent.type,
            title: editingEvent.title,
            description: editingEvent.description,
            priority: editingEvent.priority,
            dueDate: editingEvent.dueDate,
            impactDays: editingEvent.impactDays,
            impactCost: editingEvent.impactCost,
            assignedToId: editingEvent.assignedTo?.id,
            activityId: editingEvent.activity?.id,
          }}
          onClose={() => setEditingEvent(null)}
        >
          <span />
        </EventDialog>
      )}
    </div>
  );
}
