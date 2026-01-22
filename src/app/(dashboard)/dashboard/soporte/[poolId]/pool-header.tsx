"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Ticket, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { formatHours, POOL_STATUSES, TICKET_STAGES } from "@/lib/support-utils";
import { cn } from "@/lib/utils";
import type { SupportPoolStatus, TicketStage } from "@prisma/client";

interface Ticket {
  id: string;
  stage: TicketStage;
  priority: string;
}

interface Pool {
  id: string;
  name: string;
  pep: string;
  status: SupportPoolStatus;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  usedPercentage: number;
  client: { name: string };
  project: { name: string } | null;
  tickets: Ticket[];
}

interface PoolHeaderProps {
  pool: Pool;
}

export function PoolHeader({ pool }: PoolHeaderProps) {
  const handleExport = () => {
    window.open(`/api/soporte/export?poolId=${pool.id}`, "_blank");
  };
  const statusConfig = POOL_STATUSES[pool.status];

  // Stats
  const openTickets = pool.tickets.filter(
    (t) => !["ATENDIDO", "CANCELADO"].includes(t.stage)
  ).length;
  const criticalTickets = pool.tickets.filter(
    (t) =>
      t.priority === "ALTA" && !["ATENDIDO", "CANCELADO"].includes(t.stage)
  ).length;
  const resolvedTickets = pool.tickets.filter(
    (t) => t.stage === "ATENDIDO"
  ).length;

  // Tickets por etapa para mostrar distribución
  const ticketsByStage = Object.keys(TICKET_STAGES).reduce((acc, stage) => {
    acc[stage] = pool.tickets.filter((t) => t.stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      {/* Title and Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{pool.name}</h1>
            <Badge variant="outline" className={cn("font-medium", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            PEP: {pool.pep} • {pool.client.name}
            {pool.project && ` • ${pool.project.name}`}
          </p>
          {pool.tickets.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Hours Progress - Main KPI */}
        <Card className="w-full md:w-80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Horas Consumidas</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  pool.usedPercentage >= 80 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {pool.usedPercentage}%
              </span>
            </div>
            <Progress
              value={pool.usedPercentage}
              className="h-3 mb-2"
              indicatorClassName={getProgressColor(pool.usedPercentage)}
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatHours(pool.usedHours)} usadas
              </span>
              <span className="font-medium">
                {formatHours(pool.remainingHours)} restantes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abiertos</p>
                <p className="text-2xl font-bold">{openTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold">{criticalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resueltos</p>
                <p className="text-2xl font-bold">{resolvedTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Totales</p>
                <p className="text-2xl font-bold">{formatHours(pool.totalHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Distribution by Stage */}
      {pool.tickets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(ticketsByStage).map(([stage, count]) => {
            if (count === 0) return null;
            const config = TICKET_STAGES[stage as keyof typeof TICKET_STAGES];
            return (
              <Badge
                key={stage}
                variant="outline"
                className={cn("gap-1", config.textColor)}
              >
                <span className={cn("w-2 h-2 rounded-full", config.color)} />
                {config.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
