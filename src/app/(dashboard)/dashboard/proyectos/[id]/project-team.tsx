"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addResourceToProject, removeResourceFromProject, getAvailableResources } from "./actions";

interface Assignment {
  id: string;
  allocationPercentage: number;
  hoursPerDay: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      code: string;
      name: string;
    } | null;
  };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: {
    code: string;
    name: string;
  } | null;
  consultorLevel: {
    code: string;
    name: string;
  } | null;
}

interface ProjectTeamProps {
  projectId: string;
  assignments: Assignment[];
}

export function ProjectTeam({ projectId, assignments }: ProjectTeamProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    allocationPercentage: 100,
    hoursPerDay: 8,
  });

  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      getAvailableResources(projectId)
        .then((users) => setAvailableUsers(users))
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) return;

    setIsLoading(true);
    try {
      await addResourceToProject({
        projectId,
        userId: formData.userId,
        allocationPercentage: formData.allocationPercentage,
        hoursPerDay: formData.hoursPerDay,
      });

      toast({
        title: "Recurso agregado",
        description: "El recurso se ha asignado al proyecto correctamente",
      });

      setOpen(false);
      setFormData({ userId: "", allocationPercentage: 100, hoursPerDay: 8 });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrio un error al agregar el recurso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    setDeletingId(assignmentId);
    try {
      await removeResourceFromProject(assignmentId, projectId);
      toast({
        title: "Recurso eliminado",
        description: "El recurso se ha removido del proyecto",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al eliminar el recurso",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipo del Proyecto
            </CardTitle>
            <CardDescription>
              {assignments.length} recursos asignados
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Recurso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Recurso al Proyecto</DialogTitle>
                <DialogDescription>
                  Selecciona un recurso y configura su asignacion al proyecto.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user">Recurso *</Label>
                    <Select
                      value={formData.userId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, userId: value })
                      }
                      disabled={loadingUsers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingUsers ? "Cargando..." : "Seleccionar recurso"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <span>{user.name}</span>
                              {user.role && (
                                <span className="text-xs text-muted-foreground">
                                  ({user.role.name})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {!loadingUsers && availableUsers.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay recursos disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="allocation">Asignacion (%)</Label>
                      <Input
                        id="allocation"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.allocationPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allocationPercentage: parseInt(e.target.value) || 100,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hours">Horas/dia</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={formData.hoursPerDay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hoursPerDay: parseFloat(e.target.value) || 8,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading || !formData.userId}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      "Agregar Recurso"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const initials = assignment.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignment.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.user.email}
                      </p>
                    </div>
                    {assignment.user.role && (
                      <Badge variant="outline">
                        {assignment.user.role.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {assignment.allocationPercentage}% asignado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.hoursPerDay.toFixed(1)} horas/dia
                      </p>
                    </div>
                    <div className="w-24">
                      <Progress value={assignment.allocationPercentage} className="h-2" />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          disabled={deletingId === assignment.id}
                        >
                          {deletingId === assignment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar recurso</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estas seguro de que deseas eliminar a {assignment.user.name} del proyecto?
                            Esta accion no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(assignment.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay recursos asignados</p>
            <Button variant="link" className="mt-2" onClick={() => setOpen(true)}>
              Agregar el primer recurso
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
