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

interface Level {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  order: number;
  _count: {
    users: number;
  };
}

interface LevelsTableProps {
  levels: Level[];
}

export function LevelsTable({ levels }: LevelsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Orden</TableHead>
          <TableHead>Codigo</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Descripcion</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Usuarios</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {levels.map((level) => (
          <TableRow key={level.id}>
            <TableCell>
              <Badge variant="outline">{level.order}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono">
                {level.code}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{level.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {level.description || "-"}
            </TableCell>
            <TableCell>
              {level.active ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{level._count.users} usuarios</Badge>
            </TableCell>
          </TableRow>
        ))}
        {levels.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No hay niveles configurados
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
