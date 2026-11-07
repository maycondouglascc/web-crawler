import React from "react";
import { cn } from "../../lib/cn";

type MediaCardProps = {
  title: string;
  meta?: string[];
  imageUrl?: string | null;
  imageAlt?: string;
  fallbackText?: string;
  fit?: "cover" | "contain";
  onClick?: () => void;
};

export function MediaCard({
  title,
  meta = [],
  imageUrl,
  imageAlt = "",
  fallbackText,
  fit = "cover",
  onClick,
}: MediaCardProps) {
  const media = (
    <div className="aspect-[1440/1024] w-full overflow-hidden rounded-control bg-media flex items-center justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          className={cn(
            "h-full w-full transition duration-200",
            fit === "cover" ? "object-cover object-top" : "object-contain p-3",
          )}
        />
      ) : fallbackText ? (
        <span className="px-4 text-center text-label text-subtle truncate max-w-full">{fallbackText}</span>
      ) : null}
    </div>
  );

  const copy = (
    <div className="flex flex-col gap-2 px-3 text-body">
      <p className="truncate text-white">{title}</p>
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-2 text-muted">
          {meta.map((item, idx) => (
            <span key={`${item}-${idx}`}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full flex-col gap-4 rounded-card bg-sunken p-6 text-left transition hover:bg-[#101112]"
      >
        {media}
        {copy}
      </button>
    );
  }

  return (
    <article className="flex flex-col gap-4 rounded-card bg-sunken p-6">
      {media}
      {copy}
    </article>
  );
}
