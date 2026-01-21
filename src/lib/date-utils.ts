import {
  addDays,
  isWeekend,
  isSameDay,
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  differenceInBusinessDays,
} from "date-fns";
import { es } from "date-fns/locale";

const LIMA_TIMEZONE = "America/Lima";

/**
 * Obtiene la fecha de hoy en la zona horaria de Lima (Peru)
 * @returns Date object representando hoy en Lima
 */
export function getTodayInLima(): Date {
  // Obtener la fecha actual formateada en Lima
  const limaDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: LIMA_TIMEZONE,
  }); // formato YYYY-MM-DD
  // Crear fecha a partir del string (esto crea la fecha en hora local del browser)
  const [year, month, day] = limaDateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Normaliza cualquier fecha a medianoche, preservando solo la parte de fecha
 * Evita problemas de timezone al comparar fechas
 */
export function normalizeDateOnly(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Compara dos fechas ignorando la hora (solo parte de fecha)
 * @returns negativo si a < b, 0 si iguales, positivo si a > b
 */
export function compareDatesOnly(a: Date, b: Date): number {
  const aNorm = normalizeDateOnly(a);
  const bNorm = normalizeDateOnly(b);
  return aNorm.getTime() - bNorm.getTime();
}

export interface Holiday {
  date: Date;
  name: string;
}

/**
 * Verifica si una fecha es feriado
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  return holidays.some((holiday) => isSameDay(new Date(holiday.date), date));
}

/**
 * Verifica si una fecha es día laboral (no fin de semana y no feriado)
 */
export function isWorkingDay(date: Date, holidays: Holiday[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

/**
 * Obtiene el siguiente día laboral
 */
export function getNextWorkingDay(date: Date, holidays: Holiday[]): Date {
  let nextDay = addDays(date, 1);
  while (!isWorkingDay(nextDay, holidays)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Agrega días laborales a una fecha
 */
export function addWorkingDays(
  startDate: Date,
  workingDaysToAdd: number,
  holidays: Holiday[]
): Date {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  // Si la fecha de inicio no es laboral, avanzar al primer día laboral
  while (!isWorkingDay(currentDate, holidays)) {
    currentDate = addDays(currentDate, 1);
  }

  while (daysAdded < workingDaysToAdd) {
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, holidays)) {
      daysAdded++;
    }
  }

  return currentDate;
}

/**
 * Calcula la fecha de fin dado inicio y duración en días laborales
 */
export function calculateEndDate(
  startDate: Date,
  durationDays: number,
  holidays: Holiday[]
): Date {
  if (durationDays <= 0) return startDate;
  return addWorkingDays(startDate, durationDays - 1, holidays);
}

/**
 * Cuenta días laborales entre dos fechas
 */
export function countWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[]
): number {
  let count = 0;
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of days) {
    if (isWorkingDay(day, holidays)) {
      count++;
    }
  }

  return count;
}

/**
 * Obtiene todos los días de un rango, marcando laborales y no laborales
 */
export function getDaysInRange(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[]
): Array<{
  date: Date;
  isWorking: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
}> {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((date) => {
    const holiday = holidays.find((h) => isSameDay(new Date(h.date), date));
    return {
      date,
      isWorking: isWorkingDay(date, holidays),
      isWeekend: isWeekend(date),
      isHoliday: !!holiday,
      holidayName: holiday?.name,
    };
  });
}

/**
 * Genera las columnas de fechas para el Gantt
 */
export function generateGanttDateColumns(
  startDate: Date,
  totalDays: number
): Array<{
  date: Date;
  dayNumber: number;
  dayOfWeek: string;
  dateFormatted: string;
  isWeekend: boolean;
}> {
  const columns: Array<{
    date: Date;
    dayNumber: number;
    dayOfWeek: string;
    dateFormatted: string;
    isWeekend: boolean;
  }> = [];

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    columns.push({
      date,
      dayNumber: i + 1,
      dayOfWeek: format(date, "EEE", { locale: es }),
      dateFormatted: format(date, "dd/MM/yy"),
      isWeekend: isWeekend(date),
    });
  }

  return columns;
}

/**
 * Calcula la posición y ancho de una barra en el Gantt
 */
export function calculateGanttBarPosition(
  activityStart: Date,
  activityEnd: Date,
  ganttStart: Date,
  cellWidth: number
): { left: number; width: number } {
  const startDiff = Math.floor(
    (activityStart.getTime() - ganttStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration =
    Math.floor(
      (activityEnd.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  return {
    left: startDiff * cellWidth,
    width: duration * cellWidth,
  };
}

/**
 * Formatea fecha para mostrar en español
 */
export function formatDateSpanish(date: Date, formatStr: string = "dd/MM/yyyy"): string {
  return format(date, formatStr, { locale: es });
}

/**
 * Obtiene el nombre del día de la semana
 */
export function getDayName(date: Date): string {
  return format(date, "EEEE", { locale: es });
}

/**
 * Obtiene feriados de Perú por defecto para un año
 * Nota: Se usa las 12:00 (mediodía) para evitar problemas de timezone
 */
export function getPeruHolidays(year: number): Holiday[] {
  return [
    { date: new Date(year, 0, 1, 12, 0, 0), name: "Año Nuevo" },
    { date: new Date(year, 4, 1, 12, 0, 0), name: "Día del Trabajo" },
    { date: new Date(year, 5, 29, 12, 0, 0), name: "San Pedro y San Pablo" },
    { date: new Date(year, 6, 28, 12, 0, 0), name: "Fiestas Patrias" },
    { date: new Date(year, 6, 29, 12, 0, 0), name: "Fiestas Patrias" },
    { date: new Date(year, 7, 30, 12, 0, 0), name: "Santa Rosa de Lima" },
    { date: new Date(year, 9, 8, 12, 0, 0), name: "Combate de Angamos" },
    { date: new Date(year, 10, 1, 12, 0, 0), name: "Día de Todos los Santos" },
    { date: new Date(year, 11, 8, 12, 0, 0), name: "Inmaculada Concepción" },
    { date: new Date(year, 11, 9, 12, 0, 0), name: "Batalla de Ayacucho" },
    { date: new Date(year, 11, 25, 12, 0, 0), name: "Navidad" },
  ];
}

/**
 * Calcula la fecha de fin de un proyecto dado la fecha de inicio y duración total en días laborales
 * @param startDate - Fecha de inicio del proyecto
 * @param totalWorkingDays - Duración total en días laborales
 * @param holidays - Lista de feriados a considerar (opcional)
 * @returns Fecha estimada de finalización
 */
export function calculateProjectEndDate(
  startDate: Date,
  totalWorkingDays: number,
  holidays: Holiday[] = []
): Date {
  if (totalWorkingDays <= 0) return startDate;

  // Obtener feriados del año de inicio y siguiente año (por si el proyecto cruza años)
  const startYear = startDate.getFullYear();
  const allHolidays = [
    ...holidays,
    ...getPeruHolidays(startYear),
    ...getPeruHolidays(startYear + 1),
  ];

  return addWorkingDays(startDate, totalWorkingDays - 1, allHolidays);
}

/**
 * Resta días laborales a una fecha (calcula hacia atrás)
 * @param endDate - Fecha de referencia (fin)
 * @param workingDaysToSubtract - Días laborales a restar
 * @param holidays - Lista de feriados
 * @returns Fecha de inicio calculada hacia atrás
 */
export function subtractWorkingDays(
  endDate: Date,
  workingDaysToSubtract: number,
  holidays: Holiday[]
): Date {
  let currentDate = new Date(endDate);
  let daysSubtracted = 0;

  // Si la fecha de fin no es laboral, retroceder al último día laboral
  while (!isWorkingDay(currentDate, holidays)) {
    currentDate = addDays(currentDate, -1);
  }

  while (daysSubtracted < workingDaysToSubtract) {
    currentDate = addDays(currentDate, -1);
    if (isWorkingDay(currentDate, holidays)) {
      daysSubtracted++;
    }
  }

  return currentDate;
}

/**
 * Calcula la fecha de inicio dado la fecha de fin y duración en días laborales (hacia atrás)
 * @param endDate - Fecha de fin
 * @param durationDays - Duración en días laborales
 * @param holidays - Lista de feriados
 * @returns Fecha de inicio
 */
export function calculateStartDate(
  endDate: Date,
  durationDays: number,
  holidays: Holiday[]
): Date {
  if (durationDays <= 0) return endDate;
  return subtractWorkingDays(endDate, durationDays - 1, holidays);
}
