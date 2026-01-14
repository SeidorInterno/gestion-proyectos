"use client";

import { Search, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRoleName?: string;
}

export function Header({
  userName = "Usuario",
  userEmail = "usuario@seidor.com",
  userRoleName = "Consultor",
}: HeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const openCommandPalette = () => {
    // Simulate Cmd+K keypress to open command palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      {/* Busqueda - Click to open command palette */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={openCommandPalette}
          className="relative w-full flex items-center gap-2 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar proyectos, clientes...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notificaciones */}
        <NotificationsDropdown />

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{userName}</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {userRoleName}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferencias
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 flex items-center gap-2 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
