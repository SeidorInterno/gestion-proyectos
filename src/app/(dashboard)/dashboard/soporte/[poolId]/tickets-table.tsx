"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Search,
  Filter,
  MessageSquare,
  Clock,
} from "lucide-react";
import { TicketDialog } from "./ticket-dialog";
import {
  TICKET_STAGES,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  type TicketStageKey,
  type TicketPriorityKey,
} from "@/lib/support-utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TicketStage, TicketType, TicketPriority } from "@prisma/client";

interface Flow {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  stage: TicketStage;
  type: TicketType;
  priority: TicketPriority;
  flowId: string | null;
  flow: { id: string; name: string } | null;
  screenshotUrl: string | null;
  excelUrl: string | null;
  incidentDate: Date | null;
  reporterEmail: string;
  ccEmails: string | null;
  estimatedHours: number | null;
  assignedTo: { id: string; name: string } | null;
  assignedToId: string | null;
  createdBy: { id: string; name: string };
  createdAt: Date;
  _count: { comments: number; timeEntries: number };
}

interface ClientProject {
  id: string;
  name: string;
  clientId: string;
}

interface TicketsTableProps {
  tickets: Ticket[];
  poolId: string;
  flows: Flow[];
  users: User[];
  clientProjects?: ClientProject[];
}

export function TicketsTable({
  tickets,
  poolId,
  flows,
  users,
  clientProjects = [],
}: TicketsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.reporterEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      stageFilter === "all" || ticket.stage === stageFilter;

    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStage && matchesPriority;
  });

  // Ordenar por prioridad y fecha
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const priorityOrder = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    const priorityDiff =
      priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, título o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Filter className="h-4 w-4 text-muted-foreground self-center" />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {Object.entries(TICKET_STAGES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(TICKET_PRIORITIES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={priorityFilter === "ALTA" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setPriorityFilter(priorityFilter === "ALTA" ? "all" : "ALTA")
          }
        >
          🔴 P1 Críticos
        </Button>
        <Button
          variant={stageFilter === "EN_ESPERA" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setStageFilter(stageFilter === "EN_ESPERA" ? "all" : "EN_ESPERA")
          }
        >
          En Espera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchTerm("");
            setStageFilter("all");
            setPriorityFilter("all");
          }}
        >
          Limpiar filtros
        </Button>
        <Badge variant="outline" className="ml-auto self-center">
          {sortedTickets.length} ticket(s)
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Asignado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron tickets
                </TableCell>
              </TableRow>
            ) : (
              sortedTickets.map((ticket) => {
                const stageConfig =
                  TICKET_STAGES[ticket.stage as TicketStageKey];
                const priorityConfig =
                  TICKET_PRIORITIES[ticket.priority as TicketPriorityKey];
                const typeConfig = TICKET_TYPES[ticket.type as keyof typeof TICKET_TYPES];

                return (
                  <TableRow key={ticket.id} className="group">
                    <TableCell>
                      <Link
                        href={`/dashboard/soporte/${poolId}/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="truncate">{ticket.title}</p>
                        {ticket.flow && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.flow.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("gap-1", stageConfig.textColor)}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            stageConfig.color
                          )}
                        />
                        {stageConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            priorityConfig.color
                          )}
                        />
                        {priorityConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedTo ? (
                        <span className="text-sm">
                          {ticket.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin asignar
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        {(ticket._count.comments > 0 ||
                          ticket._count.timeEntries > 0) && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {ticket._count.comments > 0 && (
                              <span className="flex items-center gap-0.5 text-xs">
                                <MessageSquare className="h-3 w-3" />
                                {ticket._count.comments}
                              </span>
                            )}
                            {ticket._count.timeEntries > 0 && (
                              <span className="flex items-center gap-0.5 text-xs">
                                <Clock className="h-3 w-3" />
                                {ticket._count.timeEntries}
                              </span>
                            )}
                          </div>
                        )}
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
                            <Link
                              href={`/dashboard/soporte/${poolId}/${ticket.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </Link>
                          </DropdownMenuItem>
                          <TicketDialog
                            poolId={poolId}
                            flows={flows}
                            users={users}
                            ticket={ticket}
                            clientProjects={clientProjects}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          </TicketDialog>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>
                            Asignarme
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
