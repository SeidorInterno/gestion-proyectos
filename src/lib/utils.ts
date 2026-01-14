import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

export function generateProjectCode(clientName: string, year: number, count: number): string {
  const prefix = clientName.substring(0, 3).toUpperCase();
  return `${prefix}-${year}-${count.toString().padStart(3, "0")}`;
}
