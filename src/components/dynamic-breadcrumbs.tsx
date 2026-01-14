"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import React from "react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  proyectos: "Proyectos",
  clientes: "Clientes",
  usuarios: "Usuarios",
  calendario: "Calendario",
  reportes: "Reportes",
  configuracion: "Configuracion",
  nuevo: "Nuevo",
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  // Split pathname and filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on dashboard root
  if (segments.length <= 1 && segments[0] === "dashboard") {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems: { label: string; href: string; isLast: boolean }[] = [];

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Try to get a friendly label
    let label = routeLabels[segment];

    // If no label found, it might be an ID (like a project ID)
    if (!label) {
      // Check if it looks like an ID (cuid format or similar)
      if (segment.length > 10 || segment.match(/^[a-z0-9]+$/i)) {
        // Skip IDs in the middle, or show "Detalle" for the last segment
        if (isLast) {
          label = "Detalle";
        } else {
          return; // Skip this segment
        }
      } else {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
    }

    breadcrumbItems.push({ label, href, isLast });
  });

  if (breadcrumbItems.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Inicio</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
