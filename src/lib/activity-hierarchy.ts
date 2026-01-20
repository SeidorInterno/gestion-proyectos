import { differenceInDays } from "date-fns";

interface Activity {
  code: string;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Determina el nivel de una actividad basado en su código
 * @param code - Código de actividad (ej: "1.1", "1.1.1", "2.2.3")
 * @returns 0 para secciones, 1 para Items, 2 para SubItems
 */
export function getActivityLevel(code: string): number {
  const parts = code.split(".");
  if (parts.length === 1) return 0; // Sección (ej: "3")
  if (parts.length === 2) return 1; // Item (ej: "1.1", "2.2")
  return 2; // SubItem (ej: "1.1.1", "2.2.3")
}

/**
 * Obtiene el código padre de un SubItem
 * @param code - Código del SubItem (ej: "1.1.1")
 * @returns Código del padre (ej: "1.1") o null si es Item/sección
 */
export function getParentCode(code: string): string | null {
  const parts = code.split(".");
  if (parts.length <= 2) return null;
  return parts.slice(0, 2).join(".");
}

/**
 * Verifica si un Item tiene SubItems
 * @param itemCode - Código del Item (ej: "1.1")
 * @param activities - Lista de todas las actividades
 * @returns true si el Item tiene al menos un SubItem
 */
export function hasSubItems<T extends Activity>(
  itemCode: string,
  activities: T[]
): boolean {
  return activities.some((a) => getParentCode(a.code) === itemCode);
}

/**
 * Obtiene los SubItems de un Item padre
 * @param parentCode - Código del Item padre
 * @param activities - Lista de todas las actividades
 * @returns Lista de SubItems del Item padre
 */
export function getSubItems<T extends Activity>(
  parentCode: string,
  activities: T[]
): T[] {
  return activities.filter((a) => getParentCode(a.code) === parentCode);
}

/**
 * Calcula el resumen de días para una fase
 * @param activities - Actividades de la fase
 * @returns { totalDays, startDate, endDate } o null si no hay fechas
 */
export function getPhaseDateSummary(
  activities: Activity[]
): { totalDays: number; startDate: Date; endDate: Date } | null {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const activity of activities) {
    if (activity.startDate) {
      const start = new Date(activity.startDate);
      if (!minDate || start < minDate) minDate = start;
    }
    if (activity.endDate) {
      const end = new Date(activity.endDate);
      if (!maxDate || end > maxDate) maxDate = end;
    }
  }

  if (!minDate || !maxDate) return null;

  const totalDays = differenceInDays(maxDate, minDate) + 1;
  return { totalDays, startDate: minDate, endDate: maxDate };
}

/**
 * Calcula el rango de fechas de un Item (incluyendo sus SubItems)
 * @param itemCode - Código del Item
 * @param activities - Lista de todas las actividades
 * @returns { startDate, endDate, totalDays } o null
 */
export function getItemDateRange(
  itemCode: string,
  activities: Activity[]
): { startDate: Date; endDate: Date; totalDays: number } | null {
  const subItems = getSubItems(itemCode, activities);
  const item = activities.find((a) => a.code === itemCode);
  const allRelated = item ? [item, ...subItems] : subItems;

  if (allRelated.length === 0) return null;

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const activity of allRelated) {
    if (activity.startDate) {
      const start = new Date(activity.startDate);
      if (!minDate || start < minDate) minDate = start;
    }
    if (activity.endDate) {
      const end = new Date(activity.endDate);
      if (!maxDate || end > maxDate) maxDate = end;
    }
  }

  if (!minDate || !maxDate) return null;

  const totalDays = differenceInDays(maxDate, minDate) + 1;
  return { startDate: minDate, endDate: maxDate, totalDays };
}
