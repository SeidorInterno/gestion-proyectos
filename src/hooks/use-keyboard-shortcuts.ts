"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      meta: true,
      description: "Nuevo (contextual)",
      action: () => {
        // Navigate to new based on current context
        if (pathname.includes("/proyectos")) {
          router.push("/dashboard/proyectos/nuevo");
        } else if (pathname.includes("/clientes")) {
          // Trigger new client dialog
          window.dispatchEvent(new CustomEvent("shortcut:new-client"));
        } else if (pathname.includes("/usuarios")) {
          // Trigger new user dialog
          window.dispatchEvent(new CustomEvent("shortcut:new-user"));
        } else {
          // Default to new project
          router.push("/dashboard/proyectos/nuevo");
        }
      },
    },
    {
      key: "p",
      meta: true,
      shift: true,
      description: "Ir a Proyectos",
      action: () => router.push("/dashboard/proyectos"),
    },
    {
      key: "c",
      meta: true,
      shift: true,
      description: "Ir a Clientes",
      action: () => router.push("/dashboard/clientes"),
    },
    {
      key: "u",
      meta: true,
      shift: true,
      description: "Ir a Usuarios",
      action: () => router.push("/dashboard/usuarios"),
    },
    {
      key: "h",
      meta: true,
      shift: true,
      description: "Ir a Dashboard",
      action: () => router.push("/dashboard"),
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? event.metaKey || event.ctrlKey : true;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
