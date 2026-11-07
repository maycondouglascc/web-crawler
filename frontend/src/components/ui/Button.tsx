import React from "react";
import { cn } from "../../lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "default" | "large";
};

const SIZES = {
  default: "h-12 px-4",
  large: "h-14 px-6",
} as const;

const VARIANTS = {
  primary: "bg-action text-ink hover:bg-action-hover",
  secondary: "border border-line bg-transparent text-white hover:bg-surface",
} as const;

export function Button({
  variant = "primary",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-body transition disabled:cursor-not-allowed disabled:opacity-50",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
