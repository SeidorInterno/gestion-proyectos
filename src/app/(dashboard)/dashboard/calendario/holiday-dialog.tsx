"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createHoliday, importPeruHolidays } from "./actions";

interface HolidayDialogProps {
  children: React.ReactNode;
}

export function HolidayDialog({ children }: HolidayDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createHoliday({
        name: formData.name,
        date: new Date(formData.date),
      });

      toast({
        title: "Feriado creado",
        description: "El feriado se ha agregado correctamente",
      });
      setOpen(false);
      setFormData({ name: "", date: "" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al crear el feriado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPeru = async () => {
    setIsImporting(true);
    try {
      const currentYear = new Date().getFullYear();
      await importPeruHolidays(currentYear);
      await importPeruHolidays(currentYear + 1);

      toast({
        title: "Feriados importados",
        description: "Se han importado los feriados de Peru",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al importar los feriados",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Feriado</DialogTitle>
          <DialogDescription>
            Agrega un nuevo dia feriado o importa los feriados oficiales de Peru
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Importar feriados de Peru */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium mb-2">Importar feriados de Peru</p>
            <p className="text-xs text-muted-foreground mb-3">
              Importa automaticamente los feriados oficiales del año actual y
              siguiente
            </p>
            <Button
              variant="outline"
              onClick={handleImportPeru}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar Feriados de Peru"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O agregar manualmente
              </span>
            </div>
          </div>

          {/* Formulario manual */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Feriado *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Fiestas Patrias"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Agregar Feriado"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
