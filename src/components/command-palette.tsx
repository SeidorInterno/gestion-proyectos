"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Users,
  Building2,
  FolderKanban,
  Calendar,
  FileBarChart,
  Settings,
  LayoutDashboard,
  Plus,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  projects?: { id: string; name: string; client: { name: string } }[];
  clients?: { id: string; name: string }[];
}

export function CommandPalette({ projects = [], clients = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[640px]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Buscar proyectos, clientes, navegar..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>

            <Command.Group heading="Acciones rapidas">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/proyectos/nuevo"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Proyecto</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/clientes?new=true"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Cliente</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/usuarios?new=true"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Usuario</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navegacion">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/proyectos"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                <span>Proyectos</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/clientes"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>Clientes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/usuarios"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Usuarios</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/calendario"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendario</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/reportes"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <FileBarChart className="mr-2 h-4 w-4" />
                <span>Reportes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/configuracion"))}
                className="cursor-pointer rounded-lg aria-selected:bg-accent"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuracion</span>
              </Command.Item>
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Proyectos">
                {projects.slice(0, 5).map((project) => (
                  <Command.Item
                    key={project.id}
                    value={`proyecto ${project.name} ${project.client.name}`}
                    onSelect={() => runCommand(() => router.push(`/dashboard/proyectos/${project.id}`))}
                    className="cursor-pointer rounded-lg aria-selected:bg-accent"
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      <span className="text-xs text-muted-foreground">{project.client.name}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {clients.length > 0 && (
              <Command.Group heading="Clientes">
                {clients.slice(0, 5).map((client) => (
                  <Command.Item
                    key={client.id}
                    value={`cliente ${client.name}`}
                    onSelect={() => runCommand(() => router.push(`/dashboard/clientes/${client.id}`))}
                    className="cursor-pointer rounded-lg aria-selected:bg-accent"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{client.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="border-t px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Presiona <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘</kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">K</kbd>
              <span className="ml-1">para abrir en cualquier momento</span>
            </p>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
