"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateProgressVariance,
  getProgressStatusColor,
  type ProgressStatus,
} from "@/lib/progress-utils";

interface ProgressComparisonCardProps {
  actualProgress: number;
  estimatedProgress: number;
  className?: string;
}

export function ProgressComparisonCard({
  actualProgress,
  estimatedProgress,
  className,
}: ProgressComparisonCardProps) {
  const variance = calculateProgressVariance(estimatedProgress, actualProgress);
  const colors = getProgressStatusColor(variance.status);

  const StatusIcon = {
    ahead: TrendingUp,
    behind: TrendingDown,
    on_track: Minus,
  }[variance.status];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso Real */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Real</span>
                  <span className="text-sm font-bold">{actualProgress}%</span>
                </div>
                <Progress value={actualProgress} className="h-2" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Progreso basado en actividades completadas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Progreso Estimado */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estimado</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {estimatedProgress}%
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-secondary-foreground/20 transition-all"
                    style={{ width: `${estimatedProgress}%` }}
                  />
                  {/* Marcador de posición estimada */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-muted-foreground/50"
                    style={{ left: `${estimatedProgress}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Progreso esperado segun el timeline del proyecto</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Badge de Estado */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-md border",
                  colors.bg,
                  colors.text,
                  colors.border
                )}
              >
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{variance.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{variance.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
