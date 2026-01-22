"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
  Users,
  Ticket,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { deleteSupportPool } from "./actions";
import { SupportPoolDialog } from "./support-pool-dialog";
import { formatHours, POOL_STATUSES } from "@/lib/support-utils";
import { cn } from "@/lib/utils";
import type { SupportPoolStatus } from "@prisma/client";

interface Pool {
  id: string;
  name: string;
  description: string | null;
  pep: string;
  status: SupportPoolStatus;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  usedPercentage: number;
  client: { id: string; name: string };
  project: { id: string; name: string } | null;
  assignments: Array<{
    user: { id: string; name: string };
  }>;
  _count: { tickets: number };
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

interface SupportPoolsTableProps {
  pools: Pool[];
  clients: Client[];
  projects: Project[];
}

export function SupportPoolsTable({
  pools,
  clients,
  projects,
}: SupportPoolsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.pep.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.client.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || pool.status === statusFilter;

    const matchesClient =
      clientFilter === "all" || pool.client.id === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleDelete = async () => {
    if (!poolToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSupportPool(poolToDelete.id);
      toast({
        title: "Bolsa eliminada",
        description: "La bolsa de soporte ha sido eliminada correctamente",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la bolsa",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPoolToDelete(null);
    }
  };

  const getStatusBadge = (status: SupportPoolStatus) => {
    const config = POOL_STATUSES[status];
    return (
      <Badge variant="outline" className={cn("font-medium", config.color)}>
        {config.label}
      </Badge>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, PEP o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(POOL_STATUSES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bolsa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Horas</TableHead>
              <TableHead className="text-center">Equipo</TableHead>
              <TableHead className="text-center">Tickets</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPools.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron bolsas de soporte
                </TableCell>
              </TableRow>
            ) : (
              filteredPools.map((pool) => (
                <TableRow key={pool.id} className="group">
                  <TableCell>
                    <Link
                      href={`/dashboard/soporte/${pool.id}`}
                      className="hover:underline"
                    >
                      <div>
                        <p className="font-medium">{pool.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pool.pep}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{pool.client.name}</p>
                      {pool.project && (
                        <p className="text-xs text-muted-foreground">
                          {pool.project.name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(pool.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[140px]">
                      <div className="flex justify-between text-xs">
                        <span>{formatHours(pool.usedHours)}</span>
                        <span className="text-muted-foreground">
                          {formatHours(pool.totalHours)}
                        </span>
                      </div>
                      <Progress
                        value={pool.usedPercentage}
                        className="h-2"
                        indicatorClassName={getProgressColor(
                          pool.usedPercentage
                        )}
                      />
                      <p
                        className={cn(
                          "text-xs",
                          pool.usedPercentage >= 80
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {pool.usedPercentage}% usado
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{pool.assignments.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span>{pool._count.tickets}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/soporte/${pool.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        <SupportPoolDialog
                          pool={pool}
                          clients={clients}
                          projects={projects}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </SupportPoolDialog>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPoolToDelete(pool)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!poolToDelete}
        onOpenChange={(open) => !open && setPoolToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar bolsa de soporte</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {poolToDelete && poolToDelete._count.tickets > 0 ? (
                  <p className="text-destructive font-medium">
                    No se puede eliminar esta bolsa porque tiene{" "}
                    {poolToDelete._count.tickets} ticket(s) en progreso.
                    Primero marcalos como Atendido o Cancelado.
                  </p>
                ) : (
                  <p>
                    Esta acción no se puede deshacer. La bolsa &quot;{poolToDelete?.name}
                    &quot; será eliminada permanentemente.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || (poolToDelete?._count.tickets ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
