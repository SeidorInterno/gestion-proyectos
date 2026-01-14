import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { NewClientButton } from "./new-client-button";
import { ClientsTable } from "./clients-table";

async function getClients() {
  const clients = await prisma.client.findMany({
    where: { active: true },
    include: {
      contacts: {
        where: { active: true },
        orderBy: { isPrimary: "desc" },
      },
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return clients;
}

export default async function ClientesPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona los clientes de Seidor RPA
          </p>
        </div>
        <NewClientButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            {clients.length} clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando...</div>}>
            <ClientsTable clients={clients} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
