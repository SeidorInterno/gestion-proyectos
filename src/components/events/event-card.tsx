"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EventCategoryBadge,
  EventPriorityBadge,
  EventStatusBadge,
  eventTypes,
} from "./event-badge";
import {
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  CheckCircle,
  Trash2,
  Edit,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { resolveEvent, closeEvent, deleteEvent } from "@/app/(dashboard)/dashboard/proyectos/event-actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: {
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
  onEdit?: (event: EventCardProps["event"]) => void;
}

export function EventCard({ event, onEdit }: EventCardProps) {
  const router = useRouter();

  const typeLabel =
    eventTypes[event.category]?.find((t) => t.value === event.type)?.label ||
    event.type;

  const handleResolve = async () => {
    const result = await resolveEvent(event.id);
    if (result.success) {
      toast({
        title: "Evento resuelto",
        description: "El evento ha sido marcado como resuelto",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    const result = await closeEvent(event.id);
    if (result.success) {
      toast({
        title: "Evento cerrado",
        description: "El evento ha sido cerrado",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    const result = await deleteEvent(event.id);
    if (result.success) {
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const isResolved = event.status === "RESUELTO" || event.status === "CERRADO";

  return (
    <Card className={isResolved ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <EventCategoryBadge category={event.category} />
            <span className="text-xs text-muted-foreground">{typeLabel}</span>
            {event.priority && <EventPriorityBadge priority={event.priority} />}
          </div>
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(event)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {!isResolved && (
                  <DropdownMenuItem onClick={handleResolve}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Resuelto
                  </DropdownMenuItem>
                )}
                {event.status === "RESUELTO" && (
                  <DropdownMenuItem onClick={handleClose}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cerrar Definitivamente
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-medium">{event.title}</h4>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(event.startDate), "dd/MM/yyyy", { locale: es })}
            {event.endDate &&
              ` - ${format(new Date(event.endDate), "dd/MM/yyyy", {
                locale: es,
              })}`}
          </div>

          {event.impactDays && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {event.impactDays} dias de impacto
            </div>
          )}

          {event.impactCost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              S/. {event.impactCost.toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          {event.assignedTo && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              Asignado: {event.assignedTo.name}
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            Reportado: {event.reportedBy.name}
          </div>
        </div>

        {event.activity && (
          <div className="text-xs text-muted-foreground">
            Actividad afectada:{" "}
            <span className="font-medium">
              {event.activity.code} - {event.activity.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
