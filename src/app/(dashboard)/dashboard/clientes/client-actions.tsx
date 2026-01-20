"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Loader2, Building2, Users, Plus } from "lucide-react";
import { updateClient, deleteClient } from "./actions";
import { ContactForm, ContactData, emptyContact } from "./contact-form";
import { AnimatePresence, motion } from "framer-motion";

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
  address?: string | null;
  contacts: Contact[];
}

interface ClientActionsProps {
  client: Client;
}

export function ClientActions({ client }: ClientActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: client.name,
    ruc: client.ruc || "",
  });
  const [contacts, setContacts] = useState<ContactData[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (editOpen) {
      setFormData({
        name: client.name,
        ruc: client.ruc || "",
      });
      setContacts(
        client.contacts.length > 0
          ? client.contacts.map((c) => ({
              id: c.id,
              name: c.name,
              position: c.position || "",
              email: c.email || "",
              phone: c.phone || "",
            }))
          : [{ ...emptyContact }]
      );
    }
  }, [editOpen, client]);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contacts[0]?.name.trim()) {
      toast.error("El nombre del contacto principal es requerido");
      return;
    }

    setIsLoading(true);

    try {
      await updateClient(client.id, {
        name: formData.name,
        ruc: formData.ruc || undefined,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position || undefined,
          email: c.email || undefined,
          phone: c.phone || undefined,
        })),
      });
      toast.success("Cliente actualizado exitosamente");
      setEditOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Ocurrio un error al actualizar el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      await deleteClient(client.id);
      toast.success("Cliente eliminado exitosamente");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("No se pudo eliminar el cliente. Puede tener proyectos asociados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente y sus contactos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
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
                      <Label htmlFor="edit-name">
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nombre del cliente"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-ruc">RUC</Label>
                      <Input
                        id="edit-ruc"
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
                        key={contact.id || `new-${index}`}
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
                onClick={() => setEditOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !formData.name.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro que deseas eliminar al cliente &quot;{client.name}&quot;?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
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
