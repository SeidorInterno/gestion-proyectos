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
import { createClient, updateClient } from "./actions";

interface Contact {
  id?: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

interface Client {
  id: string;
  name: string;
  ruc: string | null;
  address: string | null;
  contacts?: Contact[];
}

interface ClientDialogProps {
  children: React.ReactNode;
  client?: Client;
}

export function ClientDialog({ children, client }: ClientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener el contacto principal si existe
  const primaryContact = client?.contacts?.find(c => c.isPrimary) || client?.contacts?.[0];

  const [formData, setFormData] = useState({
    name: client?.name || "",
    ruc: client?.ruc || "",
    contactName: primaryContact?.name || "",
    contactPosition: primaryContact?.position || "",
    contactEmail: primaryContact?.email || "",
    contactPhone: primaryContact?.phone || "",
    address: client?.address || "",
  });

  const isEditing = !!client;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Transformar datos al nuevo formato con contactos
    const clientData = {
      name: formData.name,
      ruc: formData.ruc || undefined,
      address: formData.address || undefined,
      contacts: [
        {
          id: primaryContact?.id,
          name: formData.contactName || "Contacto Principal",
          position: formData.contactPosition || undefined,
          email: formData.contactEmail || undefined,
          phone: formData.contactPhone || undefined,
          isPrimary: true,
        },
      ],
    };

    try {
      if (isEditing) {
        await updateClient(client.id, clientData);
        toast({
          title: "Cliente actualizado",
          description: "El cliente se ha actualizado correctamente",
        });
      } else {
        await createClient(clientData);
        toast({
          title: "Cliente creado",
          description: "El cliente se ha creado correctamente",
        });
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al guardar el cliente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente"
              : "Ingresa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ruc">RUC</Label>
                <Input
                  id="ruc"
                  value={formData.ruc}
                  onChange={(e) =>
                    setFormData({ ...formData, ruc: e.target.value })
                  }
                  placeholder="20123456789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Telefono Contacto</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contactName">Nombre del Contacto *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="Nombre del contacto"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPosition">Cargo</Label>
                <Input
                  id="contactPosition"
                  value={formData.contactPosition}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPosition: e.target.value })
                  }
                  placeholder="Gerente de TI"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email del Contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Direccion</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Direccion del cliente"
              />
            </div>
          </div>
          <DialogFooter>
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
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
