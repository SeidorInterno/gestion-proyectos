"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog, CheckCircle, XCircle, Search, X } from "lucide-react";
import { UserActions } from "./user-actions";
import { NewUserButton } from "./new-user-button";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  consultorLevelId: string | null;
  active: boolean;
  createdAt: Date;
  role: {
    code: string;
    name: string;
    hasLevels: boolean;
  };
  consultorLevel: {
    code: string;
    name: string;
  } | null;
  _count: {
    projectsAsManager: number;
    assignments: number;
  };
}

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
}

const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
  MANAGER: "default",
  ARQUITECTO_RPA: "secondary",
  ANALISTA_FUNCIONAL: "secondary",
  CONSULTOR: "outline",
};

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Obtener roles unicos para el filtro
  const uniqueRoles = useMemo(() => {
    const roles = new Map<string, string>();
    users.forEach((user) => {
      roles.set(user.role.code, user.role.name);
    });
    return Array.from(roles.entries());
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === "all" || user.role.code === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.active) ||
        (statusFilter === "inactive" && !user.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {uniqueRoles.map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Contador */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </p>
      )}

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Proyectos</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => {
            const initials = user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={roleVariants[user.role.code] || "outline"}>
                      {user.role.name}
                    </Badge>
                    {user.consultorLevel && (
                      <span className="text-xs text-muted-foreground">
                        {user.consultorLevel.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.active ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">Inactivo</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{user._count.projectsAsManager} como PM</p>
                    <p className="text-muted-foreground">
                      {user._count.assignments} asignaciones
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <UserActions
                    user={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      roleId: user.roleId,
                      roleCode: user.role.code,
                      roleName: user.role.name,
                      roleHasLevels: user.role.hasLevels,
                      consultorLevelId: user.consultorLevelId,
                      consultorLevelCode: user.consultorLevel?.code || null,
                      consultorLevelName: user.consultorLevel?.name || null,
                      active: user.active,
                    }}
                    currentUserId={currentUserId}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <UserCog className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground">
                      No se encontraron usuarios con los filtros aplicados
                    </p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={clearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      No hay usuarios registrados
                    </p>
                    <NewUserButton variant="link" />
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
