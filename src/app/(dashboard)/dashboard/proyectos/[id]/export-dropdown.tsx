"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Phase {
  id: string;
  name: string;
  type: string;
  order: number;
  activities: {
    id: string;
    code: string;
    name: string;
    durationDays: number;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    progress: number;
    participationType: string;
  }[];
}

interface Assignment {
  id: string;
  user: {
    id: string;
    name: string | null;
    role: {
      code: string;
      name: string;
    } | null;
  };
}

interface ExportDropdownProps {
  project: {
    id: string;
    name: string;
    code: string | null;
    status: string;
    startDate: Date | null;
    tool: string;
    client: {
      name: string;
    };
    manager: {
      name: string | null;
    } | null;
    phases: Phase[];
    assignments: Assignment[];
  };
  actualProgress: number;
  estimatedProgress: number;
}

const statusLabels: Record<string, string> = {
  PLANIFICACION: "Planificación",
  EN_PROGRESO: "En Progreso",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
  PENDIENTE: "Pendiente",
  BLOQUEADO: "Bloqueado",
};

export function ExportDropdown({ project, actualProgress, estimatedProgress }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Crear workbook
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen del Proyecto
      const summaryData = [
        ["RESUMEN DEL PROYECTO"],
        [],
        ["Nombre", project.name],
        ["Código", project.code || "-"],
        ["Cliente", project.client.name],
        ["Project Manager", project.manager?.name || "Sin asignar"],
        ["Estado", statusLabels[project.status] || project.status],
        ["Herramienta", project.tool],
        ["Fecha Inicio", formatDate(project.startDate)],
        ["Progreso Real", `${actualProgress.toFixed(1)}%`],
        ["Progreso Estimado", `${estimatedProgress.toFixed(1)}%`],
        [],
        ["Exportado el", format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs["!cols"] = [{ wch: 20 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen");

      // Hoja 2: Cronograma de Actividades
      const activitiesData = [
        ["CRONOGRAMA DE ACTIVIDADES"],
        [],
        ["Fase", "Código", "Actividad", "Duración (días)", "Fecha Inicio", "Fecha Fin", "Estado", "Progreso"],
      ];

      project.phases.forEach((phase) => {
        phase.activities.forEach((activity) => {
          activitiesData.push([
            phase.name,
            activity.code,
            activity.name,
            activity.durationDays.toString(),
            formatDate(activity.startDate),
            formatDate(activity.endDate),
            statusLabels[activity.status] || activity.status,
            `${activity.progress}%`,
          ]);
        });
      });

      const activitiesWs = XLSX.utils.aoa_to_sheet(activitiesData);
      activitiesWs["!cols"] = [
        { wch: 15 }, { wch: 10 }, { wch: 45 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, activitiesWs, "Cronograma");

      // Hoja 3: Equipo
      const teamData = [
        ["EQUIPO DEL PROYECTO"],
        [],
        ["Nombre", "Rol"],
      ];

      project.assignments.forEach((assignment) => {
        teamData.push([
          assignment.user.name || "-",
          assignment.user.role?.name || "-",
        ]);
      });

      const teamWs = XLSX.utils.aoa_to_sheet(teamData);
      teamWs["!cols"] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, teamWs, "Equipo");

      // Descargar archivo
      const fileName = `${project.code || project.name}_${format(new Date(), "yyyyMMdd")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportación exitosa",
        description: `Archivo ${fileName} descargado`,
      });
    } catch (error) {
      console.error("Error exportando Excel:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar a Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Reporte de Proyecto", pageWidth / 2, 20, { align: "center" });

      // Nombre del proyecto
      doc.setFontSize(14);
      doc.text(project.name, pageWidth / 2, 30, { align: "center" });

      // Info básica
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let y = 45;

      const addLine = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 60, y);
        y += 7;
      };

      addLine("Código", project.code || "-");
      addLine("Cliente", project.client.name);
      addLine("PM", project.manager?.name || "Sin asignar");
      addLine("Estado", statusLabels[project.status] || project.status);
      addLine("Herramienta", project.tool);
      addLine("Fecha Inicio", formatDate(project.startDate));
      addLine("Progreso Real", `${actualProgress.toFixed(1)}%`);
      addLine("Progreso Estimado", `${estimatedProgress.toFixed(1)}%`);

      y += 10;

      // Tabla de actividades
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Cronograma de Actividades", 20, y);
      y += 5;

      const tableData = project.phases.flatMap((phase) =>
        phase.activities.map((activity) => [
          activity.code,
          activity.name.length > 35 ? activity.name.substring(0, 35) + "..." : activity.name,
          `${activity.durationDays}d`,
          formatDate(activity.startDate),
          `${activity.progress}%`,
        ])
      );

      autoTable(doc, {
        startY: y,
        head: [["Código", "Actividad", "Días", "Inicio", "Avance"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 80 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
        },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.text(
            `Generado el ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        },
      });

      // Descargar
      const fileName = `${project.code || project.name}_${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(fileName);

      toast({
        title: "Exportación exitosa",
        description: `Archivo ${fileName} descargado`,
      });
    } catch (error) {
      console.error("Error exportando PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar a PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Exportar a Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
