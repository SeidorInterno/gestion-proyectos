import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { NewUserButton } from "./new-user-button";
import { UsersTable } from "./users-table";

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: true,
      consultorLevel: true,
      _count: {
        select: {
          projectsAsManager: true,
          assignments: true,
        },
      },
    },
  });
}

export default async function UsuariosPage() {
  const session = await auth();

  // Solo MANAGER puede ver esta pagina
  if (session?.user?.roleCode !== "MANAGER") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        <NewUserButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription>
            {users.length} usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} currentUserId={session?.user?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
