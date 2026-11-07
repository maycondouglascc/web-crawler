import React from "react";
import { FigmaIcon } from "./icons";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function SearchField({ value, onChange, placeholder = "Search", label = "Search" }: SearchFieldProps) {
  return (
    <label className="flex h-12 w-full items-center gap-2 rounded-control bg-surface px-4 focus-within:ring-2 focus-within:ring-white/80 lg:w-[411px]">
      <FigmaIcon name="search" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full bg-transparent text-body text-white placeholder:text-muted focus:outline-none"
      />
    </label>
  );
}
