"use client";

import { GanttChart } from "./gantt-chart";
import { recalculateProjectDates } from "@/app/(dashboard)/dashboard/proyectos/event-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

interface GanttChartWrapperProps {
  phases: Phase[];
  startDate: Date;
  holidays: Holiday[];
  projectStatus?: string;
  activeBlockers?: ActiveBlocker[];
  blockerPeriods?: BlockerPeriod[];
  projectId: string;
  userRole?: string;
}

export function GanttChartWrapper({
  phases,
  startDate,
  holidays,
  projectStatus,
  activeBlockers = [],
  blockerPeriods = [],
  projectId,
  userRole,
}: GanttChartWrapperProps) {
  const router = useRouter();

  const handleRecalculateDates = async (daysToAdd: number) => {
    try {
      const result = await recalculateProjectDates(projectId, daysToAdd);
      if (result.success) {
        toast.success(result.message || "Fechas recalculadas correctamente");
        router.refresh();
      } else {
        toast.error(result.error || "Error al recalcular fechas");
      }
    } catch (error) {
      toast.error("Error al recalcular fechas");
      console.error(error);
    }
  };

  return (
    <GanttChart
      phases={phases}
      startDate={startDate}
      holidays={holidays}
      projectStatus={projectStatus}
      activeBlockers={activeBlockers}
      blockerPeriods={blockerPeriods}
      projectId={projectId}
      userRole={userRole}
      onRecalculateDates={handleRecalculateDates}
    />
  );
}
