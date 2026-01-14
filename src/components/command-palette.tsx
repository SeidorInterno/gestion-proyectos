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
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[500px]">
        <Command className="rounded-lg border-0">
          <div className="flex items-center border-b px-4 py-3">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Buscar proyectos, clientes, navegar..."
              className="flex h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[350px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>

            <Command.Group heading="Acciones rapidas" className="pb-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/proyectos/nuevo"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Nuevo Proyecto</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/clientes?new=true"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Nuevo Cliente</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/usuarios?new=true"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Nuevo Usuario</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navegacion" className="pb-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/proyectos"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>Proyectos</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/clientes"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Clientes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/usuarios"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Usuarios</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/calendario"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Calendario</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/reportes"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
                <span>Reportes</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/configuracion"))}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Configuracion</span>
              </Command.Item>
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Proyectos" className="pb-2">
                {projects.slice(0, 5).map((project) => (
                  <Command.Item
                    key={project.id}
                    value={`proyecto ${project.name} ${project.client.name}`}
                    onSelect={() => runCommand(() => router.push(`/dashboard/proyectos/${project.id}`))}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{project.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{project.client.name}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {clients.length > 0 && (
              <Command.Group heading="Clientes" className="pb-2">
                {clients.slice(0, 5).map((client) => (
                  <Command.Item
                    key={client.id}
                    value={`cliente ${client.name}`}
                    onSelect={() => runCommand(() => router.push(`/dashboard/clientes/${client.id}`))}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md text-sm aria-selected:bg-accent"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{client.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="border-t px-4 py-3 bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>Presiona</span>
              <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px] font-medium">⌘</kbd>
              <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px] font-medium">K</kbd>
              <span>para abrir en cualquier momento</span>
            </p>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
