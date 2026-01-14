"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizes = {
  sm: { width: 32, strokeWidth: 3, fontSize: "text-[10px]" },
  md: { width: 48, strokeWidth: 4, fontSize: "text-xs" },
  lg: { width: 64, strokeWidth: 5, fontSize: "text-sm" },
};

export function ProgressCircle({
  value,
  size = "md",
  showValue = true,
  className,
}: ProgressCircleProps) {
  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Color based on progress
  const getColor = () => {
    if (value >= 100) return "text-green-500";
    if (value >= 75) return "text-blue-500";
    if (value >= 50) return "text-yellow-500";
    if (value >= 25) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg
        width={width}
        height={width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", getColor())}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium",
            fontSize
          )}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
