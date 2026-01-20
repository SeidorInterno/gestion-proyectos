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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Search, Users, Star, X, FolderKanban } from "lucide-react";
import { ClientActions } from "./client-actions";
import { NewClientButton } from "./new-client-button";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

interface Client {
  id: string;
  name: string;
  ruc: string | null;
  address: string | null;
  contacts: Contact[];
  _count: {
    projects: number;
  };
}

interface ClientsTableProps {
  clients: Client[];
  canEdit?: boolean;
}

export function ClientsTable({ clients, canEdit = true }: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = useMemo(() => {
    if (searchTerm === "") return clients;

    const term = searchTerm.toLowerCase();
    return clients.filter((client) => {
      const matchesName = client.name.toLowerCase().includes(term);
      const matchesRuc = client.ruc?.toLowerCase().includes(term);
      const matchesContact = client.contacts.some(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term)
      );

      return matchesName || matchesRuc || matchesContact;
    });
  }, [clients, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="space-y-4">
      {/* Busqueda */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RUC, contacto o email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={clearSearch}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Contador */}
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </p>
      )}

      {/* Tabla */}
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Contacto Principal</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead>Proyectos</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => {
              const primaryContact =
                client.contacts.find((c) => c.isPrimary) || client.contacts[0];

              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.ruc || "-"}</TableCell>
                  <TableCell>
                    {primaryContact ? (
                      <div className="flex items-center gap-1">
                        <span>{primaryContact.name}</span>
                        {primaryContact.position && (
                          <span className="text-xs text-muted-foreground">
                            ({primaryContact.position})
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{primaryContact?.email || "-"}</TableCell>
                  <TableCell>{primaryContact?.phone || "-"}</TableCell>
                  <TableCell>
                    {client.contacts.length > 1 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">
                            <Users className="h-3 w-3 mr-1" />
                            {client.contacts.length}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {client.contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-center gap-1 text-sm"
                              >
                                {contact.isPrimary && (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                )}
                                <span>{contact.name}</span>
                                {contact.position && (
                                  <span className="text-muted-foreground">
                                    - {contact.position}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {client.contacts.length || 0}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client._count.projects > 0
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-200 border border-blue-200 dark:border-blue-500/50"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <FolderKanban className="h-3 w-3" />
                      {client._count.projects}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <ClientActions
                        client={{
                          id: client.id,
                          name: client.name,
                          ruc: client.ruc,
                          contacts: client.contacts.map((c) => ({
                            id: c.id,
                            name: c.name,
                            position: c.position,
                            email: c.email,
                            phone: c.phone,
                            isPrimary: c.isPrimary,
                          })),
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  {searchTerm ? (
                    <>
                      <p className="text-muted-foreground">
                        No se encontraron clientes con &quot;{searchTerm}&quot;
                      </p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={clearSearch}
                      >
                        Limpiar busqueda
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        No hay clientes registrados
                      </p>
                      <NewClientButton variant="link" />
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
