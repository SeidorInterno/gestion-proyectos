import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getTicketById } from "../actions";
import { getUsersForSelect } from "../../actions";
import { TicketComments } from "./ticket-comments";
import { TicketTimeline } from "./ticket-timeline";
import { TicketTime } from "./ticket-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ExternalLink,
  Calendar,
  User,
  Mail,
  Clock,
  FileText,
  Image,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TICKET_STAGES, TICKET_TYPES, TICKET_PRIORITIES, formatHours } from "@/lib/support-utils";
import { cn } from "@/lib/utils";
import { hasPermission, getCurrentRole } from "@/lib/auth-utils";

interface PageProps {
  params: Promise<{ poolId: string; ticketId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId);

  if (!ticket) {
    return { title: "Ticket no encontrado | Seidor RPA" };
  }

  return {
    title: `${ticket.code} | Soporte | Seidor RPA`,
    description: ticket.title,
  };
}

async function TicketContent({
  poolId,
  ticketId,
}: {
  poolId: string;
  ticketId: string;
}) {
  const [ticket, users, canComment, canAddTime, currentRole] = await Promise.all([
    getTicketById(ticketId),
    getUsersForSelect(),
    hasPermission("ticketComments", "create"),
    hasPermission("ticketTime", "create"),
    getCurrentRole(),
  ]);

  if (!ticket) {
    notFound();
  }

  const stageConfig = TICKET_STAGES[ticket.stage as keyof typeof TICKET_STAGES];
  const typeConfig = TICKET_TYPES[ticket.type as keyof typeof TICKET_TYPES];
  const priorityConfig = TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES];

  // CONSULTOR no ve comentarios internos
  const visibleComments =
    currentRole === "CONSULTOR"
      ? ticket.comments.filter((c) => !c.isInternal)
      : ticket.comments;

  const canSeeInternalComments = currentRole !== "CONSULTOR";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/soporte/${poolId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a {ticket.pool.name}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{ticket.code}</h1>
            <Badge
              variant="outline"
              className={cn("gap-1", stageConfig.textColor)}
            >
              <span className={cn("w-2 h-2 rounded-full", stageConfig.color)} />
              {stageConfig.label}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <span
                className={cn("w-2 h-2 rounded-full", priorityConfig.color)}
              />
              {priorityConfig.label}
            </Badge>
          </div>
          <h2 className="text-lg text-muted-foreground">{ticket.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={typeConfig.color}>
            {typeConfig.label}
          </Badge>
          {ticket.estimatedHours && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Est: {formatHours(ticket.estimatedHours)}
            </Badge>
          )}
          {ticket.totalHours > 0 && (
            <Badge variant="default">
              <Clock className="h-3 w-3 mr-1" />
              Real: {formatHours(ticket.totalHours)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {(ticket.screenshotUrl || ticket.excelUrl || ticket.attachments.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Adjuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ticket.screenshotUrl && (
                    <a
                      href={ticket.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded">
                        <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">Screenshot / Correo</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.screenshotUrl}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {ticket.excelUrl && (
                    <a
                      href={ticket.excelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="p-2 bg-green-100 dark:bg-green-950 rounded">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">Excel Transacciones</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.excelUrl}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{attachment.name}</p>
                        {attachment.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <TicketComments
            ticketId={ticket.id}
            comments={visibleComments}
            canComment={canComment}
            canSeeInternal={canSeeInternalComments}
          />

          {/* Time Entries */}
          <TicketTime
            ticketId={ticket.id}
            entries={ticket.timeEntries}
            canAddTime={canAddTime}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <p className="font-medium">
                    {ticket.assignedTo?.name || "Sin asignar"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Creado por</p>
                  <p className="font-medium">{ticket.createdBy.name}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Email de respuesta
                  </p>
                  <p className="font-medium">{ticket.reporterEmail}</p>
                </div>
              </div>

              {ticket.flow && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Flujo</p>
                    <p className="font-medium">{ticket.flow.name}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reportado</p>
                  <p className="font-medium">
                    {format(new Date(ticket.reportedDate), "PPP", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {ticket.incidentDate && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Fecha del incidente
                      </p>
                      <p className="font-medium">
                        {format(new Date(ticket.incidentDate), "PPP", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {ticket.startedAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Iniciado</p>
                      <p className="font-medium">
                        {format(new Date(ticket.startedAt), "PPP", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {ticket.resolvedAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Resuelto</p>
                      <p className="font-medium">
                        {format(new Date(ticket.resolvedAt), "PPP", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <TicketTimeline history={ticket.history} />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-72" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { poolId, ticketId } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TicketContent poolId={poolId} ticketId={ticketId} />
    </Suspense>
  );
}
