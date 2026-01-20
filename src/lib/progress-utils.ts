import { differenceInDays } from "date-fns";
import { getTodayInLima, normalizeDateOnly } from "./date-utils";

interface Phase {
  type?: string; // PREPARE, CONNECT, REALIZE, RUN
  activities: Array<{
    status: string;
    progress: number;
    startDate?: Date | null;
    endDate: Date | null;
  }>;
}

/**
 * Calcula el progreso estimado basado en el avance esperado de cada actividad
 * según la fecha actual en relación a sus fechas de inicio y fin.
 * Excluye la fase PREPARE para ser consistente con el progreso real.
 *
 * Para cada actividad:
 * - Si endDate <= hoy: debería estar al 100%
 * - Si startDate <= hoy < endDate: debería estar a (días_transcurridos / duración) * 100%
 * - Si startDate > hoy (o no tiene fechas): 0%
 *
 * @param phases - Array de fases con sus actividades
 * @param today - Fecha actual (opcional, default: hoy en Lima)
 * @returns Porcentaje de progreso estimado (0-100) con hasta 2 decimales
 */
export function calculateEstimatedProgress(
  phases: Phase[],
  today: Date = getTodayInLima()
): number {
  // Excluir fase PREPARE del cálculo (consistente con progreso real)
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");

  const allActivities = projectPhases.flatMap((p) => p.activities);
  const totalActivities = allActivities.length;

  if (totalActivities === 0) return 0;

  const todayNorm = normalizeDateOnly(today);

  // Calcular el progreso esperado de cada actividad
  let totalExpectedProgress = 0;

  for (const activity of allActivities) {
    // Si la actividad ya está COMPLETADA, su esperado es 100%
    // (ya cumplió con lo que se esperaba, sin importar las fechas)
    if (activity.status === "COMPLETADO") {
      totalExpectedProgress += 100;
      continue;
    }

    // Sin fecha de fin, no podemos calcular progreso esperado
    if (!activity.endDate) {
      continue;
    }

    const endNorm = normalizeDateOnly(new Date(activity.endDate));

    // Si la fecha de fin ya pasó o es hoy, debería estar al 100%
    if (endNorm.getTime() <= todayNorm.getTime()) {
      totalExpectedProgress += 100;
      continue;
    }

    // Si tiene fecha de inicio, calcular progreso parcial
    if (activity.startDate) {
      const startNorm = normalizeDateOnly(new Date(activity.startDate));

      // Si aún no ha empezado, 0%
      if (todayNorm.getTime() < startNorm.getTime()) {
        continue;
      }

      // Calcular progreso parcial basado en días transcurridos
      const totalDays = differenceInDays(endNorm, startNorm) + 1; // +1 para incluir ambos días
      const elapsedDays = differenceInDays(todayNorm, startNorm) + 1; // +1 para incluir el día actual

      if (totalDays > 0) {
        const activityExpected = Math.min(100, (elapsedDays / totalDays) * 100);
        totalExpectedProgress += activityExpected;
      }
    }
  }

  // Promedio de progreso esperado
  const estimatedProgress = totalExpectedProgress / totalActivities;

  // Redondear a máximo 2 decimales
  return Math.round(estimatedProgress * 100) / 100;
}

/**
 * Calcula cuántas actividades están atrasadas
 * Una actividad está atrasada si su endDate ya pasó y no está COMPLETADA
 * @param phases - Array de fases con sus actividades
 * @param today - Fecha actual (opcional, default: hoy)
 * @returns Número de actividades atrasadas
 */
export function calculateDelayedActivities(
  phases: Phase[],
  today: Date = getTodayInLima()
): number {
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");
  const allActivities = projectPhases.flatMap((p) => p.activities);

  const todayNorm = normalizeDateOnly(today);

  return allActivities.filter((activity) => {
    if (!activity.endDate) return false;
    const endNorm = normalizeDateOnly(new Date(activity.endDate));
    // Atrasada = endDate es hoy o ya pasó Y no está completada
    return endNorm.getTime() <= todayNorm.getTime() && activity.status !== "COMPLETADO";
  }).length;
}

/**
 * Calcula el progreso estimado basado en el timeline del proyecto (método lineal)
 * DEPRECATED: Usar calculateEstimatedProgress basado en actividades para mayor precisión
 * @param startDate - Fecha de inicio del proyecto
 * @param endDate - Fecha de fin del proyecto
 * @param today - Fecha actual (opcional, default: hoy)
 * @returns Porcentaje de progreso estimado (0-100)
 */
export function calculateEstimatedProgressLinear(
  startDate: Date | null,
  endDate: Date | null,
  today: Date = getTodayInLima()
): number {
  if (!startDate || !endDate) return 0;

  const startNorm = normalizeDateOnly(new Date(startDate));
  const endNorm = normalizeDateOnly(new Date(endDate));
  const todayNorm = normalizeDateOnly(today);

  // Si el proyecto no ha comenzado
  if (todayNorm.getTime() < startNorm.getTime()) return 0;

  // Si el proyecto ya terminó (pasó la fecha de fin)
  if (todayNorm.getTime() > endNorm.getTime()) return 100;

  // Calcular porcentaje de días transcurridos
  const totalDays = (endNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (todayNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24);

  if (totalDays <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100)));
}

/**
 * Calcula el progreso real basado en el campo progress de cada actividad
 * Excluye la fase PREPARE porque es trabajo pre-kickoff
 * @param phases - Array de fases con sus actividades
 * @returns Porcentaje de progreso real (0-100) con hasta 2 decimales
 */
export function calculateActualProgress(phases: Phase[]): number {
  // Excluir fase PREPARE del cálculo (es trabajo pre-kickoff)
  const projectPhases = phases.filter((p) => p.type !== "PREPARE");

  const allActivities = projectPhases.flatMap((p) => p.activities);
  const totalActivities = allActivities.length;

  if (totalActivities === 0) return 0;

  // Sumar el progreso de todas las actividades
  const totalProgress = allActivities.reduce((sum, activity) => {
    // Usar el campo progress directamente, o 100 si está completada
    const activityProgress =
      activity.status === "COMPLETADO" ? 100 : activity.progress;
    return sum + activityProgress;
  }, 0);

  // Promedio de progreso real
  const actualProgress = totalProgress / totalActivities;

  // Redondear a máximo 2 decimales
  return Math.round(actualProgress * 100) / 100;
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
 * @param delayedActivities - Número de actividades atrasadas (opcional)
 * @param threshold - Umbral para considerar "en línea" (default: 5%)
 * @returns Objeto con varianza, estado y etiquetas
 */
export function calculateProgressVariance(
  estimated: number,
  actual: number,
  delayedActivities: number = 0,
  threshold: number = 5
): ProgressVariance {
  const variance = actual - estimated;

  // Si hay actividades atrasadas, el proyecto está atrasado sin importar los números
  if (delayedActivities > 0) {
    return {
      variance,
      status: "behind",
      label: `Atrasado (${delayedActivities} ${delayedActivities === 1 ? "actividad" : "actividades"})`,
      description: `Hay ${delayedActivities} ${delayedActivities === 1 ? "actividad atrasada" : "actividades atrasadas"}`,
    };
  }

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

export type ScheduleStatus = "on-time" | "delayed" | "ahead";

export interface ScheduleVariance {
  days: number;
  status: ScheduleStatus;
  label: string;
}

/**
 * Calcula la varianza del cronograma comparando fecha fin actual vs baseline
 * @param currentEndDate - Fecha de fin calculada actual
 * @param baselineEndDate - Fecha de fin original (baseline)
 * @returns Objeto con días de diferencia, estado y etiqueta
 */
export function calculateScheduleVariance(
  currentEndDate: Date,
  baselineEndDate: Date | null
): ScheduleVariance {
  if (!baselineEndDate) {
    return {
      days: 0,
      status: "on-time",
      label: "Sin baseline",
    };
  }

  const current = new Date(currentEndDate);
  const baseline = new Date(baselineEndDate);

  // Normalizar a medianoche
  current.setHours(0, 0, 0, 0);
  baseline.setHours(0, 0, 0, 0);

  const days = differenceInDays(current, baseline);

  if (days > 0) {
    return {
      days,
      status: "delayed",
      label: `+${days} días vs baseline`,
    };
  }

  if (days < 0) {
    return {
      days: Math.abs(days),
      status: "ahead",
      label: `${Math.abs(days)} días adelantado`,
    };
  }

  return {
    days: 0,
    status: "on-time",
    label: "Según plan original",
  };
}

/**
 * Obtiene el color CSS según el estado del cronograma
 */
export function getScheduleStatusColor(status: ScheduleStatus): string {
  switch (status) {
    case "ahead":
      return "text-blue-600 dark:text-blue-400";
    case "delayed":
      return "text-amber-600 dark:text-amber-400";
    case "on-time":
    default:
      return "text-green-600 dark:text-green-400";
  }
}
