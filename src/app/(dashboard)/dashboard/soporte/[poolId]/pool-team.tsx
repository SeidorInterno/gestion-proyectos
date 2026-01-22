"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/alert-dialog";
import { Plus, UserMinus, Loader2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { assignUserToPool, removeUserFromPool } from "../actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: { code: string; name: string };
}

interface Assignment {
  user: {
    id: string;
    name: string;
    email: string;
    role: { code: string; name: string };
  };
}

interface PoolTeamProps {
  poolId: string;
  assignments: Assignment[];
  allUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: { code: string; name: string };
  }>;
  canManage: boolean;
}

export function PoolTeam({
  poolId,
  assignments,
  allUsers,
  canManage,
}: PoolTeamProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Usuarios no asignados
  const assignedUserIds = new Set(assignments.map((a) => a.user.id));
  const availableUsers = allUsers.filter((u) => !assignedUserIds.has(u.id));

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      await assignUserToPool(poolId, selectedUserId);
      toast({
        title: "Recurso asignado",
        description: "El recurso ha sido agregado al equipo de soporte",
      });
      setSelectedUserId("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo asignar el recurso",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    setIsRemoving(true);
    try {
      await removeUserFromPool(poolId, userToRemove.id);
      toast({
        title: "Recurso removido",
        description: "El recurso ha sido removido del equipo de soporte",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo remover el recurso",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
      setUserToRemove(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (roleCode: string) => {
    switch (roleCode) {
      case "MANAGER":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      case "ARQUITECTO_RPA":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "ANALISTA_FUNCIONAL":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipo de Soporte
          </CardTitle>
          {canManage && availableUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Seleccionar recurso" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddUser}
                disabled={!selectedUserId || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin equipo asignado</h3>
            <p className="text-muted-foreground">
              Agregá recursos para que puedan atender los tickets de esta bolsa.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map(({ user }) => (
              <Card key={user.id} className="relative group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setUserToRemove(user)}
                      >
                        <UserMinus className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${getRoleBadgeColor(user.role.code)}`}
                  >
                    {user.role.name}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!userToRemove}
        onOpenChange={(open) => !open && setUserToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover del equipo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que querés remover a {userToRemove?.name} del equipo de
              soporte? Podrás volver a agregarlo después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removiendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
