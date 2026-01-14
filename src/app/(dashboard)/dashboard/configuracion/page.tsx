import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Layers, Calendar } from "lucide-react";
import { RolesTable } from "./roles-table";
import { LevelsTable } from "./levels-table";
import { HolidayImporter } from "./holiday-importer";

async function getRoles() {
  return prisma.role.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

async function getLevels() {
  return prisma.consultorLevel.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

export default async function ConfiguracionPage() {
  const session = await auth();

  // Solo MANAGER puede acceder a configuracion
  if (session?.user?.roleCode !== "MANAGER") {
    redirect("/dashboard");
  }

  const [roles, levels] = await Promise.all([getRoles(), getLevels()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra roles, niveles y parametros del sistema
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Niveles
          </TabsTrigger>
          <TabsTrigger value="holidays" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Feriados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roles del Sistema
              </CardTitle>
              <CardDescription>
                Roles disponibles y sus permisos en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesTable roles={roles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Niveles de Consultor
              </CardTitle>
              <CardDescription>
                Niveles de experiencia para consultores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LevelsTable levels={levels} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Importar Feriados
              </CardTitle>
              <CardDescription>
                Importa los feriados oficiales de Peru para un año
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HolidayImporter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info de permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Matriz de Permisos
          </CardTitle>
          <CardDescription>
            Permisos por rol en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Recurso</th>
                  <th className="text-center py-2 px-3 font-medium">Manager</th>
                  <th className="text-center py-2 px-3 font-medium">Arquitecto RPA</th>
                  <th className="text-center py-2 px-3 font-medium">Analista</th>
                  <th className="text-center py-2 px-3 font-medium">Consultor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3">Usuarios</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Clientes</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-blue-600">CRU</td>
                  <td className="text-center py-2 px-3 text-gray-600">R</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Proyectos</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-blue-600">CRU</td>
                  <td className="text-center py-2 px-3 text-gray-600">R</td>
                  <td className="text-center py-2 px-3 text-gray-600">R*</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Eventos</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-blue-600">CRU</td>
                  <td className="text-center py-2 px-3 text-blue-600">CRU</td>
                  <td className="text-center py-2 px-3 text-gray-600">CR</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">Calendario</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-gray-600">R</td>
                  <td className="text-center py-2 px-3 text-gray-600">R</td>
                  <td className="text-center py-2 px-3 text-gray-600">R</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Configuracion</td>
                  <td className="text-center py-2 px-3 text-green-600">CRUD</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                  <td className="text-center py-2 px-3 text-muted-foreground">-</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4">
              * Solo proyectos donde esta asignado | C=Crear, R=Leer, U=Actualizar, D=Eliminar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
