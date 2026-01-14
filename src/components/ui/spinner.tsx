"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizes[size], className)} />
  );
}

// Full page loading overlay
export function LoadingOverlay({ message = "Cargando..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-12 w-12 text-blue-600" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-lg font-medium text-muted-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

// Inline loading state
export function InlineLoading({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Spinner size="md" className="text-blue-600" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Button loading state
export function ButtonLoading() {
  return <Spinner size="sm" className="mr-2" />;
}

// Dots loading animation
export function DotsLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-blue-600"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Progress loading with percentage
export function ProgressLoading({
  progress,
  message,
}: {
  progress: number;
  message?: string;
}) {
  return (
    <div className="w-full max-w-md space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{message || "Procesando..."}</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
