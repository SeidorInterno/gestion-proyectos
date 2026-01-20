"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResourceFiltersProps {
  currentFilter: string;
  counts: {
    all: number;
    available: number;
    partial: number;
    occupied: number;
    overallocated: number;
  };
}

export function ResourceFilters({ currentFilter, counts }: ResourceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    router.push(`/dashboard/recursos?${params.toString()}`);
  };

  const filters = [
    { value: "all", label: "Todos", count: counts.all },
    { value: "available", label: "Disponibles", count: counts.available, activeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300" },
    { value: "partial", label: "Parciales", count: counts.partial, activeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300" },
    { value: "overallocated", label: "Alerta", count: counts.overallocated, activeClass: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300" },
  ];

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant="ghost"
          size="sm"
          onClick={() => handleFilterChange(filter.value)}
          className={cn(
            "text-xs h-7 px-3 rounded-md",
            currentFilter === filter.value
              ? filter.activeClass || "bg-background shadow-sm"
              : "hover:bg-background/50"
          )}
        >
          {filter.label}
          <span className="ml-1.5 text-muted-foreground">
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
}
