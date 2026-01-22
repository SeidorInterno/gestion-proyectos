"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { TICKET_STAGES, TICKET_PRIORITIES } from "@/lib/support-utils";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

interface TicketTimelineProps {
  history: HistoryEntry[];
}

const FIELD_LABELS: Record<string, string> = {
  stage: "Etapa",
  priority: "Prioridad",
  type: "Tipo",
  assignedToId: "Asignado a",
  estimatedHours: "Horas estimadas",
};

function getValueLabel(field: string, value: string | null): string {
  if (!value) return "Sin asignar";

  switch (field) {
    case "stage":
      return TICKET_STAGES[value as keyof typeof TICKET_STAGES]?.label || value;
    case "priority":
      return TICKET_PRIORITIES[value as keyof typeof TICKET_PRIORITIES]?.label || value;
    case "type":
      const typeLabels: Record<string, string> = {
        INCIDENCIA: "Incidencia",
        CAMBIO: "Cambio",
        MEJORA: "Mejora",
      };
      return typeLabels[value] || value;
    case "estimatedHours":
      return `${value}h`;
    default:
      return value;
  }
}

export function TicketTimeline({ history }: TicketTimelineProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sin cambios registrados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {history.map((entry, index) => {
              const fieldLabel = FIELD_LABELS[entry.field] || entry.field;
              const oldLabel = getValueLabel(entry.field, entry.oldValue);
              const newLabel = getValueLabel(entry.field, entry.newValue);

              return (
                <div key={entry.id} className="relative flex gap-3">
                  {/* Dot */}
                  <div
                    className={cn(
                      "relative z-10 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center",
                      index === 0
                        ? "border-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <p className="text-sm">
                      <span className="font-medium">{entry.user.name}</span>
                      {" cambió "}
                      <span className="font-medium">{fieldLabel}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {entry.oldValue && (
                        <>
                          <span className="line-through">{oldLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                      <span className="font-medium text-foreground">
                        {newLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
