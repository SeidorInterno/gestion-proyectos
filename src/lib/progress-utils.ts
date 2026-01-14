import { differenceInDays } from "date-fns";

interface Phase {
  type?: string; // PREPARE, CONNECT, REALIZE, RUN
  activities: Array<{
    status: string;
    progress: number;
    endDate: Date | null;
  }>;
}

/**
 * Calcula el progreso estimado basado en el timeline del proyecto
 * @param startDate - Fecha de inicio del proyecto
 * @param endDate - Fecha de fin del proyecto
 * @param today - Fecha actual (opcional, default: hoy)
 * @returns Porcentaje de progreso estimado (0-100)
 */
export function calculateEstimatedProgress(
  startDate: Date | null,
  endDate: Date | null,
  today: Date = new Date()
): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(today);

  // Normalizar a medianoche
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  // Si el proyecto no ha comenzado
  if (current < start) return 0;

  // Si el proyecto ya terminó (pasó la fecha de fin)
  if (current > end) return 100;

  // Calcular porcentaje de días transcurridos
  const totalDays = differenceInDays(end, start);
  const elapsedDays = differenceInDays(current, start);

  if (totalDays <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));
}

/**
 * Calcula el progreso real basado en actividades completadas
 * Excluye la fase PREPARE porque es trabajo pre-kickoff
 * @param phases - Array de fases con sus actividades
 * @returns Porcentaje de progreso real (0-100)
 */
export function calculateActualProgress(phases: Phase[]): number {
  // Excluir fase PREPARE del cálculo (es trabajo pre-kickoff)
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");

  const totalActivities = projectPhases.reduce(
    (sum, phase) => sum + phase.activities.length,
    0
  );

  const completedActivities = projectPhases.reduce(
    (sum, phase) =>
      sum + phase.activities.filter((a) => a.status === "COMPLETADO").length,
    0
  );

  return totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;
}

/**
 * Calcula el progreso real basado en el progreso individual de cada actividad
 * Alternativa más granular que solo contar completados
 * Excluye la fase PREPARE porque es trabajo pre-kickoff
 * @param phases - Array de fases con sus actividades
 * @returns Porcentaje de progreso real (0-100)
 */
export function calculateWeightedProgress(phases: Phase[]): number {
  // Excluir fase PREPARE del cálculo (es trabajo pre-kickoff)
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");

  const totalActivities = projectPhases.reduce(
    (sum, phase) => sum + phase.activities.length,
    0
  );

  if (totalActivities === 0) return 0;

  const totalProgress = projectPhases.reduce(
    (sum, phase) =>
      sum + phase.activities.reduce((actSum, a) => actSum + a.progress, 0),
    0
  );

  return Math.round(totalProgress / totalActivities);
}

/**
 * Obtiene la fecha de fin del proyecto basada en las actividades
 * Excluye la fase PREPARE porque es trabajo pre-kickoff
 * @param phases - Array de fases con sus actividades
 * @param fallbackDate - Fecha por defecto si no hay actividades con fechas
 * @returns Fecha de fin calculada
 */
export function getProjectEndDate(
  phases: Phase[],
  fallbackDate: Date = new Date()
): Date {
  // Excluir fase PREPARE del cálculo (es trabajo pre-kickoff)
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");

  let maxDate = new Date(fallbackDate);

  projectPhases.forEach((phase) => {
    phase.activities.forEach((activity) => {
      if (activity.endDate) {
        const activityEnd = new Date(activity.endDate);
        if (activityEnd > maxDate) {
          maxDate = activityEnd;
        }
      }
    });
  });

  return maxDate;
}

export type ProgressStatus = "ahead" | "on_track" | "behind";

interface ProgressVariance {
  variance: number;
  status: ProgressStatus;
  label: string;
  description: string;
}

/**
 * Calcula la varianza entre el progreso estimado y real
 * @param estimated - Progreso estimado (0-100)
 * @param actual - Progreso real (0-100)
 * @param threshold - Umbral para considerar "en línea" (default: 5%)
 * @returns Objeto con varianza, estado y etiquetas
 */
export function calculateProgressVariance(
  estimated: number,
  actual: number,
  threshold: number = 5
): ProgressVariance {
  const variance = actual - estimated;

  if (variance > threshold) {
    return {
      variance,
      status: "ahead",
      label: `Adelantado ${variance}%`,
      description: `El proyecto está ${variance}% por encima de lo estimado`,
    };
  }

  if (variance < -threshold) {
    return {
      variance,
      status: "behind",
      label: `Atrasado ${Math.abs(variance)}%`,
      description: `El proyecto está ${Math.abs(variance)}% por debajo de lo estimado`,
    };
  }

  return {
    variance,
    status: "on_track",
    label: "En linea",
    description: "El proyecto avanza segun lo planificado",
  };
}

/**
 * Obtiene el color CSS según el estado del progreso
 */
export function getProgressStatusColor(status: ProgressStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "ahead":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-200",
      };
    case "behind":
      return {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
      };
    case "on_track":
    default:
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
      };
  }
}

/**
 * Obtiene el icono según el estado del progreso
 */
export function getProgressStatusIcon(status: ProgressStatus): string {
  switch (status) {
    case "ahead":
      return "TrendingUp";
    case "behind":
      return "TrendingDown";
    case "on_track":
    default:
      return "Minus";
  }
}
