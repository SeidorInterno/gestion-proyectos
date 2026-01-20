"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileBarChart, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const reportTypes = [
  {
    id: "cronograma",
    name: "Cronograma de Proyecto",
    description: "Exporta el cronograma Gantt de un proyecto especifico",
    icon: FileBarChart,
    formats: ["excel", "pdf"],
  },
  {
    id: "avance",
    name: "Reporte de Avance",
    description: "Estado actual y progreso de actividades por proyecto",
    icon: FileBarChart,
    formats: ["excel", "pdf"],
  },
  {
    id: "recursos",
    name: "Utilizacion de Recursos",
    description: "Asignacion y carga de trabajo de los colaboradores",
    icon: FileBarChart,
    formats: ["excel"],
  },
  {
    id: "clientes",
    name: "Proyectos por Cliente",
    description: "Listado de proyectos agrupados por cliente",
    icon: FileBarChart,
    formats: ["excel", "pdf"],
  },
];

export default function ReportesPage() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const currentReport = reportTypes.find((r) => r.id === selectedReport);

  const handleGenerate = async () => {
    if (!selectedReport || !selectedFormat) {
      toast({
        title: "Selecciona opciones",
        description: "Debes seleccionar un tipo de reporte y formato",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Llamar a la API para generar el reporte
      const response = await fetch(
        `/api/reports?type=${selectedReport}&format=${selectedFormat}`
      );

      if (!response.ok) {
        throw new Error("Error al generar el reporte");
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Obtener el nombre del archivo del header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `reporte_${selectedReport}.xlsx`;

      // Crear link de descarga y activarlo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado en formato ${selectedFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrio un error al generar el reporte",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">
          Genera y exporta reportes de proyectos y recursos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Selector de reporte */}
        <Card>
          <CardHeader>
            <CardTitle>Generar Reporte</CardTitle>
            <CardDescription>
              Selecciona el tipo de reporte y formato de exportacion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentReport && (
              <>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm">{currentReport.description}</p>
                </div>

                <div className="space-y-2">
                  <Label>Formato de Exportacion</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentReport.formats.includes("excel") && (
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            Excel (.xlsx)
                          </div>
                        </SelectItem>
                      )}
                      {currentReport.formats.includes("pdf") && (
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-600" />
                            PDF (.pdf)
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedFormat}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generar y Descargar
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Lista de reportes disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Reportes Disponibles</CardTitle>
            <CardDescription>
              Tipos de reportes que puedes generar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReport === report.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-start gap-3">
                    <report.icon
                      className={`h-5 w-5 mt-0.5 ${
                        selectedReport === report.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {report.formats.map((format) => (
                          <span
                            key={format}
                            className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded"
                          >
                            {format.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
          <CardDescription>
            Historial de reportes generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileBarChart className="h-12 w-12 mx-auto mb-2" />
            <p>No hay reportes generados recientemente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
