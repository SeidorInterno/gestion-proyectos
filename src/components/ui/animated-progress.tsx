"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-yellow-500",
  danger: "bg-red-600",
};

export function AnimatedProgress({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  variant = "default",
  className,
}: AnimatedProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Auto-determine variant based on progress
  const autoVariant = (() => {
    if (percentage === 100) return "success";
    if (percentage >= 70) return "default";
    if (percentage >= 30) return "warning";
    return "danger";
  })();

  const finalVariant = variant === "default" && percentage > 0 ? autoVariant : variant;

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">Progreso</span>
          <motion.span
            key={percentage}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-slate-700"
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-slate-200 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full transition-colors",
            variantClasses[finalVariant]
          )}
        />
      </div>
    </div>
  );
}

// Circular progress component
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage === 100) return "#16a34a"; // green-600
    if (percentage >= 70) return "#2563eb"; // blue-600
    if (percentage >= 30) return "#eab308"; // yellow-500
    return "#dc2626"; // red-600
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <motion.span
          key={percentage}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute text-lg font-semibold"
          style={{ color: getColor() }}
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
}

// Multi-segment progress for phases
interface Phase {
  name: string;
  progress: number;
  color: string;
}

interface MultiSegmentProgressProps {
  phases: Phase[];
  className?: string;
}

export function MultiSegmentProgress({
  phases,
  className,
}: MultiSegmentProgressProps) {
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  const avgProgress = phases.length > 0 ? totalProgress / phases.length : 0;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progreso Total</span>
        <span className="font-semibold">{Math.round(avgProgress)}%</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
        {phases.map((phase, index) => (
          <motion.div
            key={phase.name}
            initial={{ width: 0 }}
            animate={{ width: `${100 / phases.length}%` }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative h-full"
            style={{ backgroundColor: phase.color }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${phase.progress}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              className="absolute inset-0 bg-white/30"
              style={{ right: `${100 - phase.progress}%`, left: 0 }}
            />
          </motion.div>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        {phases.map((phase) => (
          <div key={phase.name} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-slate-600">{phase.name}</span>
            <span className="font-medium">{phase.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
