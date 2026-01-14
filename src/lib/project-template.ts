/**
 * Template de la estructura SAM (SMART AGILE Methodology)
 * Este template se usa para generar automáticamente las fases y actividades
 * al crear un nuevo proyecto
 */

export interface ActivityTemplate {
  code: string;
  name: string;
  defaultDuration: number; // días laborales
  participationType: "PREVIO_KICKOFF" | "CLIENTE" | "SEIDOR" | "RECUPERADOS" | "FIN_PROYECTO";
}

export interface PhaseTemplate {
  name: string;
  type: "PREPARE" | "CONNECT" | "REALIZE" | "RUN";
  order: number;
  activities: ActivityTemplate[];
}

export const SAM_TEMPLATE: PhaseTemplate[] = [
  {
    name: "Prepare",
    type: "PREPARE",
    order: 1,
    activities: [
      {
        code: "1.1",
        name: "Aseguramiento de Ambientes, Credenciales y Requerimientos Técnicos",
        defaultDuration: 3,
        participationType: "PREVIO_KICKOFF",
      },
      {
        code: "1.1.1",
        name: "Identificación de Stakeholders y Riesgos del Proyecto",
        defaultDuration: 1,
        participationType: "PREVIO_KICKOFF",
      },
      {
        code: "1.1.2",
        name: "Preparación del KickOff",
        defaultDuration: 1,
        participationType: "PREVIO_KICKOFF",
      },
      {
        code: "1.1.3",
        name: "Presentación del KickOff",
        defaultDuration: 1,
        participationType: "CLIENTE",
      },
    ],
  },
  {
    name: "Connect",
    type: "CONNECT",
    order: 2,
    activities: [
      {
        code: "2.1",
        name: "Levantamiento",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "2.1.1",
        name: "Entendimiento detallado del AS IS",
        defaultDuration: 2,
        participationType: "CLIENTE",
      },
      {
        code: "2.1.2",
        name: "Generación de video detallado del proceso + Consultas",
        defaultDuration: 2,
        participationType: "CLIENTE",
      },
      {
        code: "2.2",
        name: "Diseño Funcional",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "2.2.1",
        name: "Definición del TO BE",
        defaultDuration: 2,
        participationType: "SEIDOR",
      },
      {
        code: "2.2.2",
        name: "Elaboración del PDD",
        defaultDuration: 3,
        participationType: "SEIDOR",
      },
      {
        code: "2.2.3",
        name: "Reunión de revisión del PDD",
        defaultDuration: 1,
        participationType: "CLIENTE",
      },
      {
        code: "2.2.4",
        name: "Aprobación del PDD",
        defaultDuration: 1,
        participationType: "CLIENTE",
      },
      {
        code: "2.3",
        name: "Diseño Solución",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "2.3.1",
        name: "Definición de pruebas integrales",
        defaultDuration: 1,
        participationType: "SEIDOR",
      },
      {
        code: "2.3.2",
        name: "Generación de Producto Backlog",
        defaultDuration: 1,
        participationType: "SEIDOR",
      },
      {
        code: "2.3.3",
        name: "Sprint Planning",
        defaultDuration: 1,
        participationType: "SEIDOR",
      },
    ],
  },
  {
    name: "Realize",
    type: "REALIZE",
    order: 3,
    activities: [
      {
        code: "3",
        name: "Desarrollo",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "3.1.1",
        name: "Construcción + Testing en Desarrollo",
        defaultDuration: 10,
        participationType: "SEIDOR",
      },
      {
        code: "3.1.2",
        name: "Playbacks",
        defaultDuration: 2,
        participationType: "CLIENTE",
      },
      {
        code: "3.2",
        name: "Pruebas Integrales - UAT",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "3.2.1",
        name: "Pruebas UAT (atendidas y desatendidas)",
        defaultDuration: 3,
        participationType: "CLIENTE",
      },
      {
        code: "3.2.2",
        name: "Ajustes de pruebas integrales",
        defaultDuration: 2,
        participationType: "SEIDOR",
      },
      {
        code: "3.2.4",
        name: "Elaboración de Manual de Usuario",
        defaultDuration: 2,
        participationType: "SEIDOR",
      },
      {
        code: "3.2.5",
        name: "Capacitación Funcional a Usuarios",
        defaultDuration: 1,
        participationType: "CLIENTE",
      },
    ],
  },
  {
    name: "Run",
    type: "RUN",
    order: 4,
    activities: [
      {
        code: "5.1",
        name: "GO LIVE",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "5.1.1",
        name: "Elaboración de documentación: DSD y PDD actualizado y Documentos para pase",
        defaultDuration: 2,
        participationType: "SEIDOR",
      },
      {
        code: "5.1.2",
        name: "Pase a Producción - Fin de Proyecto",
        defaultDuration: 1,
        participationType: "FIN_PROYECTO",
      },
      {
        code: "5.2",
        name: "HyperCare - Garantía hasta 1 semana luego del GO Live",
        defaultDuration: 0,
        participationType: "SEIDOR",
      },
      {
        code: "5.2.1",
        name: "Estabilización en PRD",
        defaultDuration: 5,
        participationType: "SEIDOR",
      },
      {
        code: "5.2.2",
        name: "Marcha blanca",
        defaultDuration: 5,
        participationType: "SEIDOR",
      },
      {
        code: "5.2.3",
        name: "Entrega de Documentación",
        defaultDuration: 1,
        participationType: "SEIDOR",
      },
      {
        code: "5.2.4",
        name: "Capacitación Técnica",
        defaultDuration: 1,
        participationType: "CLIENTE",
      },
    ],
  },
];

/**
 * Genera la estructura completa de fases y actividades para un proyecto nuevo
 */
export function generateProjectStructure(
  projectId: string
): Array<{
  phase: Omit<PhaseTemplate, "activities"> & { projectId: string };
  activities: Array<ActivityTemplate & { phaseId?: string; order: number }>;
}> {
  return SAM_TEMPLATE.map((phase) => ({
    phase: {
      name: phase.name,
      type: phase.type,
      order: phase.order,
      projectId,
    },
    activities: phase.activities.map((activity, index) => ({
      ...activity,
      order: index + 1,
    })),
  }));
}

/**
 * Calcula la duración total estimada del proyecto en días laborales
 */
export function calculateTotalProjectDuration(): number {
  return SAM_TEMPLATE.reduce((total, phase) => {
    return (
      total +
      phase.activities.reduce((phaseTotal, activity) => {
        return phaseTotal + activity.defaultDuration;
      }, 0)
    );
  }, 0);
}

/**
 * Obtiene el color CSS para un tipo de participación
 */
export function getParticipationColor(
  type: "PREVIO_KICKOFF" | "CLIENTE" | "SEIDOR" | "RECUPERADOS" | "FIN_PROYECTO"
): string {
  const colors = {
    PREVIO_KICKOFF: "bg-orange-500",
    CLIENTE: "bg-green-400",
    SEIDOR: "bg-blue-500",
    RECUPERADOS: "bg-yellow-400",
    FIN_PROYECTO: "bg-purple-600",
  };
  return colors[type];
}

/**
 * Obtiene la etiqueta en español para un tipo de participación
 */
export function getParticipationLabel(
  type: "PREVIO_KICKOFF" | "CLIENTE" | "SEIDOR" | "RECUPERADOS" | "FIN_PROYECTO"
): string {
  const labels = {
    PREVIO_KICKOFF: "Previo al Kick Off",
    CLIENTE: "Participación activa Cliente",
    SEIDOR: "Seidor",
    RECUPERADOS: "Días Recuperados",
    FIN_PROYECTO: "Fin del proyecto",
  };
  return labels[type];
}

/**
 * Interface para duraciones de fases personalizadas
 */
export interface PhaseDurations {
  prepare: number;
  connect: number;
  realize: number;
  run: number;
}

/**
 * Obtiene las duraciones por defecto de cada fase SAM (en días laborales)
 */
export function getDefaultPhaseDurations(): PhaseDurations {
  const durations: PhaseDurations = {
    prepare: 0,
    connect: 0,
    realize: 0,
    run: 0,
  };

  for (const phase of SAM_TEMPLATE) {
    const phaseDuration = phase.activities.reduce(
      (sum, activity) => sum + activity.defaultDuration,
      0
    );

    switch (phase.type) {
      case "PREPARE":
        durations.prepare = phaseDuration;
        break;
      case "CONNECT":
        durations.connect = phaseDuration;
        break;
      case "REALIZE":
        durations.realize = phaseDuration;
        break;
      case "RUN":
        durations.run = phaseDuration;
        break;
    }
  }

  return durations;
}

/**
 * Escala las duraciones de actividades de una fase según la duración personalizada
 * @param phase - Template de la fase
 * @param targetDuration - Duración deseada para la fase (en días laborales)
 * @returns Actividades con duraciones escaladas
 */
export function scalePhaseActivities(
  phase: PhaseTemplate,
  targetDuration: number
): ActivityTemplate[] {
  // Calcular duración original de la fase
  const originalDuration = phase.activities.reduce(
    (sum, activity) => sum + activity.defaultDuration,
    0
  );

  // Si no hay duración original o target, retornar actividades sin cambios
  if (originalDuration === 0 || targetDuration === 0) {
    return phase.activities.map(activity => ({
      ...activity,
      defaultDuration: activity.defaultDuration > 0 ? Math.max(1, Math.round(activity.defaultDuration)) : 0,
    }));
  }

  // Calcular factor de escala
  const scaleFactor = targetDuration / originalDuration;

  // Escalar cada actividad
  const scaledActivities = phase.activities.map(activity => {
    if (activity.defaultDuration === 0) {
      // Actividades de encabezado (duración 0) permanecen igual
      return { ...activity };
    }

    // Escalar y redondear, mínimo 1 día
    const scaledDuration = Math.max(1, Math.round(activity.defaultDuration * scaleFactor));
    return {
      ...activity,
      defaultDuration: scaledDuration,
    };
  });

  // Ajustar para que la suma sea exactamente el target
  const currentTotal = scaledActivities.reduce(
    (sum, activity) => sum + activity.defaultDuration,
    0
  );

  if (currentTotal !== targetDuration) {
    // Encontrar la actividad más larga para ajustar la diferencia
    const diff = targetDuration - currentTotal;
    const largestActivityIndex = scaledActivities
      .map((activity, index) => ({ duration: activity.defaultDuration, index }))
      .filter(item => item.duration > 0)
      .sort((a, b) => b.duration - a.duration)[0]?.index;

    if (largestActivityIndex !== undefined) {
      const newDuration = scaledActivities[largestActivityIndex].defaultDuration + diff;
      if (newDuration >= 1) {
        scaledActivities[largestActivityIndex] = {
          ...scaledActivities[largestActivityIndex],
          defaultDuration: newDuration,
        };
      }
    }
  }

  return scaledActivities;
}

/**
 * Genera el template SAM con duraciones personalizadas por fase
 * @param customDurations - Duraciones personalizadas para cada fase
 * @returns Template SAM con actividades escaladas
 */
export function generateScaledSAMTemplate(
  customDurations: PhaseDurations
): PhaseTemplate[] {
  return SAM_TEMPLATE.map(phase => {
    let targetDuration: number;

    switch (phase.type) {
      case "PREPARE":
        targetDuration = customDurations.prepare;
        break;
      case "CONNECT":
        targetDuration = customDurations.connect;
        break;
      case "REALIZE":
        targetDuration = customDurations.realize;
        break;
      case "RUN":
        targetDuration = customDurations.run;
        break;
      default:
        targetDuration = 0;
    }

    return {
      ...phase,
      activities: scalePhaseActivities(phase, targetDuration),
    };
  });
}
