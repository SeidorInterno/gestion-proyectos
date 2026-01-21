"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  FileSpreadsheet,
  FileCheck,
  File,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createDocument, deleteDocument } from "./document-actions";

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string | null;
  version: string | null;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
}

interface ProjectDocumentsProps {
  projectId: string;
  documents: Document[];
  currentUserId: string;
}

const documentTypes = [
  { value: "PDD", label: "PDD (Process Design Document)", icon: FileText },
  { value: "DSD", label: "DSD (Solution Design Document)", icon: FileSpreadsheet },
  { value: "MANUAL", label: "Manual de Usuario", icon: BookOpen },
  { value: "ACTA", label: "Acta de Reunión", icon: ClipboardList },
  { value: "REQUERIMIENTO", label: "Documento de Requerimientos", icon: FileCheck },
  { value: "OTRO", label: "Otro", icon: File },
];

const getDocumentIcon = (type: string) => {
  const docType = documentTypes.find((d) => d.value === type);
  return docType?.icon || File;
};

const getDocumentTypeLabel = (type: string) => {
  const docType = documentTypes.find((d) => d.value === type);
  return docType?.label.split(" (")[0] || type;
};

const getDocumentTypeBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    PDD: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    DSD: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    MANUAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    ACTA: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    REQUERIMIENTO: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    OTRO: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return colors[type] || colors.OTRO;
};

export function ProjectDocuments({ projectId, documents, currentUserId }: ProjectDocumentsProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "PDD",
    url: "",
    version: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "PDD",
      url: "",
      version: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    if (!formData.url.trim()) {
      toast({ title: "Error", description: "La URL es requerida", variant: "destructive" });
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(formData.url);
    } catch {
      toast({ title: "Error", description: "Ingresa una URL válida", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await createDocument({
        projectId,
        name: formData.name.trim(),
        type: formData.type as "PDD" | "DSD" | "MANUAL" | "ACTA" | "REQUERIMIENTO" | "OTRO",
        url: formData.url.trim(),
        version: formData.version.trim() || undefined,
        description: formData.description.trim() || undefined,
      });

      toast({ title: "Documento agregado", description: "El enlace al documento ha sido guardado" });
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo agregar el documento", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteDocument(deleteId);
      toast({ title: "Documento eliminado", description: "El enlace ha sido eliminado" });
      router.refresh();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el documento", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documentos del Proyecto</CardTitle>
            <CardDescription>
              PDD, DSD, Manuales y otros documentos (enlaces a SharePoint)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Documento</DialogTitle>
                <DialogDescription>
                  Agrega un enlace a un documento en SharePoint
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre del documento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: PDD Automatización de Facturas v1.0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipo de documento *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="version">Versión</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="Ej: 1.0, 2.1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="url">URL de SharePoint *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://seidor.sharepoint.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega el enlace compartido del documento en SharePoint
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Breve descripción del documento..."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>No hay documentos cargados</p>
              <p className="text-sm">Haz clic en &quot;Agregar Documento&quot; para añadir un enlace</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const Icon = getDocumentIcon(doc.type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{doc.name}</span>
                          {doc.version && (
                            <span className="text-xs text-muted-foreground">v{doc.version}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getDocumentTypeBadgeColor(doc.type)}>
                            {getDocumentTypeLabel(doc.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            por {doc.uploadedBy.name} • {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el enlace al documento. El archivo en SharePoint no será afectado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
