"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

interface FormFieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, description, required, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();
    const errorId = `${fieldId}-error`;
    const descriptionId = `${fieldId}-description`;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={fieldId}
          className={cn(error && "text-destructive")}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(requerido)</span>}
        </Label>

        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <Input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(
            error && errorId,
            description && descriptionId
          ) || undefined}
          aria-required={required}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, description, required, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();
    const errorId = `${fieldId}-error`;
    const descriptionId = `${fieldId}-description`;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={fieldId}
          className={cn(error && "text-destructive")}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(requerido)</span>}
        </Label>

        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(
            error && errorId,
            description && descriptionId
          ) || undefined}
          aria-required={required}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

export { FormField, FormTextarea };
