"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ProjectDialog } from "./project-dialog";
import { deleteProject } from "./actions";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  managerId?: string | null;
  tool: string;
  startDate?: Date | string | null;
  status?: string;
}

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al eliminar el proyecto",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/proyectos/${project.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Cronograma
            </Link>
          </DropdownMenuItem>
          <ProjectDialog project={project}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          </ProjectDialog>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar el proyecto &quot;{project.name}&quot;?
              Esta accion no se puede deshacer y se eliminaran todas las fases,
              actividades y asignaciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
