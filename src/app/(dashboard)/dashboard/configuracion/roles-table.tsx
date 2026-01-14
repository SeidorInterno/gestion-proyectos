"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hasLevels: boolean;
  active: boolean;
  order: number;
  _count: {
    users: number;
  };
}

interface RolesTableProps {
  roles: Role[];
}

export function RolesTable({ roles }: RolesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Codigo</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Descripcion</TableHead>
          <TableHead>Niveles</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Usuarios</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell>
              <Badge variant="outline" className="font-mono">
                {role.code}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{role.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {role.description || "-"}
            </TableCell>
            <TableCell>
              {role.hasLevels ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Si</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">No</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              {role.active ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{role._count.users} usuarios</Badge>
            </TableCell>
          </TableRow>
        ))}
        {roles.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No hay roles configurados
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
