"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutList, GanttChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectsViewToggleProps {
  currentView: string;
}

export function ProjectsViewToggle({ currentView }: ProjectsViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "table") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`/dashboard/proyectos?${params.toString()}`);
  };

  return (
    <div className="flex items-center border rounded-lg p-1 bg-muted/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("table")}
        className={cn(
          "gap-2",
          currentView === "table" && "bg-background shadow-sm"
        )}
      >
        <LayoutList className="h-4 w-4" />
        Tabla
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("timeline")}
        className={cn(
          "gap-2",
          currentView === "timeline" && "bg-background shadow-sm"
        )}
      >
        <GanttChart className="h-4 w-4" />
        Timeline
      </Button>
    </div>
  );
}
