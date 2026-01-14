"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventList } from "@/components/events/event-list";
import { AlertTriangle } from "lucide-react";

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

interface ProjectEventsProps {
  projectId: string;
  currentUserId: string;
  events: Event[];
  activities: Array<{ id: string; code: string; name: string }>;
  users: Array<{ id: string; name: string }>;
}

export function ProjectEvents({
  projectId,
  currentUserId,
  events,
  activities,
  users,
}: ProjectEventsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Eventos del Proyecto
        </CardTitle>
        <CardDescription>
          Blockers, riesgos, pausas, cambios de alcance y otros eventos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EventList
          projectId={projectId}
          currentUserId={currentUserId}
          events={events}
          activities={activities}
          users={users}
        />
      </CardContent>
    </Card>
  );
}
