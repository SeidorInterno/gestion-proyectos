"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";

interface Project {
  id: string;
  name: string;
  client: { name: string };
}

interface Client {
  id: string;
  name: string;
}

export function CommandPaletteProvider() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load data when user presses Cmd+K
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey) && !loaded) {
        try {
          const [projectsRes, clientsRes] = await Promise.all([
            fetch("/api/projects/search"),
            fetch("/api/clients/search"),
          ]);

          if (projectsRes.ok) {
            const projectsData = await projectsRes.json();
            setProjects(projectsData);
          }

          if (clientsRes.ok) {
            const clientsData = await clientsRes.json();
            setClients(clientsData);
          }

          setLoaded(true);
        } catch (error) {
          console.error("Error loading command palette data:", error);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loaded]);

  return <CommandPalette projects={projects} clients={clients} />;
}
