import React from "react";
import { cn } from "../../lib/cn";
import { FigmaIcon } from "./icons";

type ChipProps = {
  label: string;
  kind?: "outline" | "filled";
  icon?: React.ReactNode;
  onClick?: () => void;
  onDismiss?: () => void;
};

export function Chip({ label, kind = "outline", icon, onClick, onDismiss }: ChipProps) {
  const className = cn(
    "inline-flex h-12 items-center gap-2.5 rounded-control px-4 text-body text-white",
    kind === "outline" ? "border border-line bg-transparent hover:bg-surface" : "bg-chip",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={className}>
      {icon}
      <span>{label}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={`Remove ${label}`}>
          <FigmaIcon name="dismiss" />
        </button>
      )}
    </div>
  );
}
