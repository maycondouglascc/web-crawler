import React from "react";
import { cn } from "../../lib/cn";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  fieldSize?: "default" | "large";
};

export function TextField({ fieldSize = "large", className, ...props }: TextFieldProps) {
  return (
    <input
      className={cn(
        "min-w-0 rounded-control bg-surface text-body text-white placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
        fieldSize === "large" ? "h-14 px-6" : "h-12 px-4",
        className,
      )}
      {...props}
    />
  );
}
