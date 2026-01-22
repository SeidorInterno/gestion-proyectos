"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxOption {
  value: string;
  label: string;
  icon?: ReactNode;
  group?: string;
}

interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateNew?: (query: string) => void;
  createLabel?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron resultados",
  disabled = false,
  allowCreate = false,
  onCreateNew,
  createLabel = "Registrar",
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Agrupar opciones por grupo
  const groupedOptions = options.reduce(
    (acc, opt) => {
      const group = opt.group || "default";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    },
    {} as Record<string, ComboboxOption[]>
  );

  // Filtrar por query (búsqueda case-insensitive)
  const filteredGroups = (() => {
    if (!query.trim()) return groupedOptions;

    const filtered: Record<string, ComboboxOption[]> = {};
    const normalizedQuery = query.toLowerCase().trim();

    for (const [group, opts] of Object.entries(groupedOptions)) {
      const matches = opts.filter((o) =>
        o.label.toLowerCase().includes(normalizedQuery)
      );
      if (matches.length > 0) filtered[group] = matches;
    }
    return filtered;
  })();

  // Verificar si hay match exacto para mostrar opción de crear
  const hasExactMatch = options.some(
    (opt) => opt.label.toLowerCase() === query.toLowerCase().trim()
  );

  // Label del valor seleccionado
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption ? (
    <span className="flex items-center gap-2">
      {selectedOption.icon}
      {selectedOption.label}
    </span>
  ) : null;

  // Obtener grupos ordenados (default primero, luego alfabético)
  const sortedGroupEntries = Object.entries(filteredGroups).sort(([a], [b]) => {
    if (a === "default") return -1;
    if (b === "default") return 1;
    return a.localeCompare(b);
  });

  const hasResults = sortedGroupEntries.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!hasResults && !allowCreate && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}

            {sortedGroupEntries.map(([group, opts], groupIndex) => (
              <CommandGroup
                key={group}
                heading={group !== "default" ? group : undefined}
              >
                {opts.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {opt.icon && (
                      <span className="mr-1">{opt.icon}</span>
                    )}
                    <span className="flex-1">{opt.label}</span>
                    {value === opt.value && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {/* Opción para crear nuevo */}
            {allowCreate && query.trim() && !hasExactMatch && (
              <>
                {hasResults && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onCreateNew?.(query.trim());
                      setQuery("");
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>
                      {createLabel} &quot;{query.trim()}&quot;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {/* Empty state cuando no hay resultados pero sí se puede crear */}
            {!hasResults && allowCreate && !query.trim() && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type { ComboboxOption, ComboboxProps };
