import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { HolidayDialog } from "./holiday-dialog";
import { HolidayList } from "./holiday-list";

async function getHolidays() {
  const currentYear = new Date().getFullYear();
  const holidays = await prisma.holiday.findMany({
    where: {
      year: { in: [currentYear, currentYear + 1] },
    },
    orderBy: { date: "asc" },
  });
  return holidays;
}

export default async function CalendarioPage() {
  const holidays = await getHolidays();
  const currentYear = new Date().getFullYear();

  const holidaysByYear = {
    [currentYear]: holidays.filter((h) => h.year === currentYear),
    [currentYear + 1]: holidays.filter((h) => h.year === currentYear + 1),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendario Laboral</h1>
          <p className="text-muted-foreground">
            Gestion de dias feriados y no laborables
          </p>
        </div>
        <HolidayDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Feriado
          </Button>
        </HolidayDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[currentYear, currentYear + 1].map((year) => (
          <Card key={year}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Feriados {year}
              </CardTitle>
              <CardDescription>
                {holidaysByYear[year]?.length || 0} dias feriados configurados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HolidayList
                holidays={holidaysByYear[year] || []}
                year={year}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              - Los feriados configurados seran excluidos automaticamente del
              calculo de dias laborales en los cronogramas.
            </p>
            <p>
              - Los fines de semana (sabado y domingo) siempre se excluyen
              automaticamente.
            </p>
            <p>
              - Puedes importar los feriados oficiales de Peru o agregarlos
              manualmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
