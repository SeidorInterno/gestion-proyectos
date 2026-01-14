"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  successText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      success = false,
      successText,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [showSuccess, setShowSuccess] = React.useState(false);

    React.useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [success]);

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          showSuccess && "bg-green-600 hover:bg-green-700",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : showSuccess ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {successText || "Completado"}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
