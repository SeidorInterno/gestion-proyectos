"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  Power,
  PowerOff,
} from "lucide-react";
import { updateUser, toggleUserActive, deleteUser, getRoles, getConsultorLevels } from "./actions";

interface UserData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  roleHasLevels: boolean;
  consultorLevelId: string | null;
  consultorLevelCode: string | null;
  consultorLevelName: string | null;
  active: boolean;
}

interface UserActionsProps {
  user: UserData;
  currentUserId?: string;
}

interface RoleOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hasLevels: boolean;
}

interface LevelOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export function UserActions({ user, currentUserId }: UserActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: "",
    roleId: user.roleId,
    consultorLevelId: user.consultorLevelId || "",
  });

  const isCurrentUser = user.id === currentUserId;

  // Cargar roles y niveles al abrir el diálogo de edición
  useEffect(() => {
    if (editOpen) {
      loadData();
    }
  }, [editOpen]);

  const loadData = async () => {
    try {
      const [rolesData, levelsData] = await Promise.all([
        getRoles(),
        getConsultorLevels(),
      ]);
      setRoles(rolesData);
      setLevels(levelsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    }
  };

  const selectedRole = roles.find(r => r.id === formData.roleId);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        roleId: formData.roleId,
        consultorLevelId: selectedRole?.hasLevels ? formData.consultorLevelId : null,
      });
      toast.success("Usuario actualizado exitosamente");
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      await toggleUserActive(user.id);
      toast.success(user.active ? "Usuario desactivado" : "Usuario activado");
      router.refresh();
    } catch (error) {
      toast.error("Error al cambiar el estado del usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteUser(user.id);
      toast.success("Usuario eliminado");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    setFormData(prev => ({
      ...prev,
      roleId,
      consultorLevelId: role?.hasLevels && levels.length > 0
        ? (levels.find(l => l.code === "N2") || levels[0]).id
        : "",
    }));
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          {!isCurrentUser && (
            <>
              <DropdownMenuItem onClick={handleToggleActive}>
                {user.active ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nombre completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="usuario@seidor.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Nueva Contraseña
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Dejar vacío para mantener la actual"
                />
                <p className="text-xs text-muted-foreground">
                  Solo completa si deseas cambiar la contraseña
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Rol <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.roleId}
                  onValueChange={handleRoleChange}
                  disabled={isCurrentUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCurrentUser && (
                  <p className="text-xs text-muted-foreground">
                    No puedes cambiar tu propio rol
                  </p>
                )}
              </div>

              {selectedRole?.hasLevels && (
                <div className="space-y-2">
                  <Label htmlFor="edit-level" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Nivel <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.consultorLevelId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, consultorLevelId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar al usuario &quot;{user.name}&quot;?
              Esta acción desactivará su cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
