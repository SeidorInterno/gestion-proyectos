"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Ajusta la fecha UTC para mostrar correctamente en cualquier timezone
function adjustDateForDisplay(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
}
import { toast } from "@/hooks/use-toast";
import { deleteHoliday } from "./actions";

interface Holiday {
  id: string;
  name: string;
  date: Date;
  year: number;
  recurring: boolean;
}

interface HolidayListProps {
  holidays: Holiday[];
  year: number;
}

export function HolidayList({ holidays, year }: HolidayListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteHoliday(deleteId);
      toast({
        title: "Feriado eliminado",
        description: "El feriado se ha eliminado correctamente",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el feriado. Verifica tus permisos.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Dia</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holidays.map((holiday) => {
            const displayDate = adjustDateForDisplay(new Date(holiday.date));
            return (
            <TableRow key={holiday.id}>
              <TableCell>
                {format(displayDate, "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {format(displayDate, "EEEE", { locale: es })}
                </Badge>
              </TableCell>
              <TableCell>{holiday.name}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteId(holiday.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            );
          })}
          {holidays.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No hay feriados configurados para {year}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar feriado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar este feriado? Esta accion no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
