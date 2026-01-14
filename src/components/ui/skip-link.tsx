"use client";

import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  href = "#main-content",
  children = "Saltar al contenido principal",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4",
        "focus:px-4 focus:py-2 focus:bg-background focus:text-foreground",
        "focus:border focus:rounded-md focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
    >
      {children}
    </a>
  );
}

// Componente para contenido solo visible a lectores de pantalla
interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: "span" | "div" | "p";
}

export function VisuallyHidden({ children, as: Component = "span" }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

// Componente para anuncios a lectores de pantalla
interface LiveRegionProps {
  children: React.ReactNode;
  "aria-live"?: "polite" | "assertive" | "off";
  "aria-atomic"?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  "aria-live": ariaLive = "polite",
  "aria-atomic": ariaAtomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}
