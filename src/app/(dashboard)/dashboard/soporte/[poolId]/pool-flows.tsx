"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Workflow,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createFlow, updateFlow, deleteFlow } from "./actions";

interface Flow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface PoolFlowsProps {
  poolId: string;
  flows: Flow[];
  canManage: boolean;
}

interface FlowDialogProps {
  poolId: string;
  flow?: Flow;
  children: React.ReactNode;
  onSuccess?: () => void;
}

function FlowDialog({ poolId, flow, children, onSuccess }: FlowDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(flow?.name || "");
  const [description, setDescription] = useState(flow?.description || "");

  const isEditing = !!flow;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateFlow(flow.id, { name, description: description || undefined });
        toast({
          title: "Flujo actualizado",
          description: "Los cambios han sido guardados",
        });
      } else {
        await createFlow({ poolId, name, description: description || undefined });
        toast({
          title: "Flujo creado",
          description: "El flujo ha sido agregado al catálogo",
        });
      }

      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el flujo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Flujo" : "Nuevo Flujo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del flujo"
              : "Agregá un nuevo proceso al catálogo de flujos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Facturación Automática"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el flujo o proceso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Flujo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PoolFlows({ poolId, flows, canManage }: PoolFlowsProps) {
  const router = useRouter();
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!flowToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFlow(flowToDelete.id);
      toast({
        title: "Flujo eliminado",
        description: "El flujo ha sido removido del catálogo",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el flujo",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setFlowToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Catálogo de Flujos
          </CardTitle>
          {canManage && (
            <FlowDialog poolId={poolId}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Flujo
              </Button>
            </FlowDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin flujos definidos</h3>
            <p className="text-muted-foreground mb-4">
              Los flujos permiten categorizar los tickets por proceso o área.
            </p>
            {canManage && (
              <FlowDialog poolId={poolId}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Flujo
                </Button>
              </FlowDialog>
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => (
              <Card key={flow.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h4 className="font-medium truncate">{flow.name}</h4>
                      </div>
                      {flow.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {flow.description}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <FlowDialog poolId={poolId} flow={flow}>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          </FlowDialog>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setFlowToDelete(flow)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!flowToDelete}
        onOpenChange={(open) => !open && setFlowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar flujo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que querés eliminar el flujo &quot;{flowToDelete?.name}&quot;?
              {flowToDelete && (
                <span className="block mt-2 text-sm">
                  Si hay tickets asociados, el flujo se desactivará en lugar de
                  eliminarse.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
