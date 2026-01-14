"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, User, Mail, Lock, Shield } from "lucide-react";
import { createUser, getRoles, getConsultorLevels } from "./actions";

interface NewUserButtonProps {
  variant?: "default" | "link";
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

export function NewUserButton({ variant = "default" }: NewUserButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    consultorLevelId: "",
  });

  // Cargar roles y niveles al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [rolesData, levelsData] = await Promise.all([
        getRoles(),
        getConsultorLevels(),
      ]);
      setRoles(rolesData);
      setLevels(levelsData);

      // Seleccionar el primer rol por defecto
      if (rolesData.length > 0 && !formData.roleId) {
        const defaultRole = rolesData.find(r => r.code === "CONSULTOR") || rolesData[0];
        setFormData(prev => ({ ...prev, roleId: defaultRole.id }));

        // Si el rol tiene niveles, seleccionar el primero
        if (defaultRole.hasLevels && levelsData.length > 0) {
          const defaultLevel = levelsData.find(l => l.code === "N2") || levelsData[0];
          setFormData(prev => ({ ...prev, consultorLevelId: defaultLevel.id }));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    }
  };

  const selectedRole = roles.find(r => r.id === formData.roleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        roleId: formData.roleId,
        consultorLevelId: selectedRole?.hasLevels ? formData.consultorLevelId : null,
      });

      toast.success("Usuario creado exitosamente", {
        description: formData.password
          ? "El usuario puede iniciar sesión con la contraseña proporcionada"
          : "Contraseña por defecto: seidor123",
      });
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: "",
        consultorLevelId: "",
      });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear el usuario";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: "",
        consultorLevelId: "",
      });
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "link" ? (
          <Button variant="link" className="mt-2">
            Crear el primer usuario
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario para el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
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
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Dejar vacío para usar: seidor123"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres. Si no se especifica, se usará &quot;seidor123&quot;
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex flex-col">
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole?.hasLevels && (
              <div className="space-y-2">
                <Label htmlFor="consultorLevel" className="flex items-center gap-2">
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
                        <div className="flex flex-col">
                          <span>{level.name}</span>
                          {level.description && (
                            <span className="text-xs text-muted-foreground">
                              {level.description}
                            </span>
                          )}
                        </div>
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.email.trim() || !formData.roleId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
