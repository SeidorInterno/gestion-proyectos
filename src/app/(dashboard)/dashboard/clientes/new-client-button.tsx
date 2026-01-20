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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Loader2, Building2, Users } from "lucide-react";
import { createClient } from "./actions";
import { ContactForm, ContactData, emptyContact } from "./contact-form";
import { AnimatePresence, motion } from "framer-motion";

interface NewClientButtonProps {
  variant?: "default" | "link";
}

const initialFormData = {
  name: "",
  ruc: "",
};

export function NewClientButton({ variant = "default" }: NewClientButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [contacts, setContacts] = useState<ContactData[]>([{ ...emptyContact }]);

  const handleAddContact = () => {
    setContacts([...contacts, { ...emptyContact }]);
  };

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleContactChange = (index: number, data: ContactData) => {
    const newContacts = [...contacts];
    newContacts[index] = data;
    setContacts(newContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que al menos el primer contacto tenga nombre
    if (!contacts[0]?.name.trim()) {
      toast.error("El nombre del contacto principal es requerido");
      return;
    }

    setIsLoading(true);

    try {
      await createClient({
        name: formData.name,
        ruc: formData.ruc || undefined,
        contacts: contacts.map((c) => ({
          name: c.name,
          position: c.position || undefined,
          email: c.email || undefined,
          phone: c.phone || undefined,
        })),
      });

      toast.success("Cliente creado exitosamente");
      setOpen(false);
      setFormData(initialFormData);
      setContacts([{ ...emptyContact }]);
      router.refresh();
    } catch (error) {
      toast.error("Ocurrio un error al crear el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setFormData(initialFormData);
      setContacts([{ ...emptyContact }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "link" ? (
          <Button variant="link" className="mt-2">
            Crear el primer cliente
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del cliente y sus personas de contacto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-6 py-4 px-1">
              {/* Informacion del Cliente */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="h-4 w-4" />
                  Informacion del Cliente
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
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
                  <div className="space-y-2">
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
                </div>
              </div>

              {/* Personas de Contacto */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Users className="h-4 w-4" />
                  Personas de Contacto
                </div>

                <AnimatePresence mode="popLayout">
                  {contacts.map((contact, index) => (
                    <ContactForm
                      key={index}
                      index={index}
                      data={contact}
                      canDelete={contacts.length > 1}
                      isPrimary={index === 0}
                      onChange={(data) => handleContactChange(index, data)}
                      onDelete={() => handleRemoveContact(index)}
                    />
                  ))}
                </AnimatePresence>

                <motion.div layout>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={handleAddContact}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar otro contacto
                  </Button>
                </motion.div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
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
