import React from "react";
import { cn } from "../../lib/cn";

type MediaCardProps = {
  title: string;
  meta?: string[];
  imageUrl?: string | null;
  imageAlt?: string;
  fit?: "cover" | "contain";
  onClick?: () => void;
};

export function MediaCard({ title, meta = [], imageUrl, imageAlt = "", fit = "cover", onClick }: MediaCardProps) {
  const media = (
    <div className="aspect-[1440/1024] w-full overflow-hidden rounded-control bg-media">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          className={cn("h-full w-full", fit === "cover" ? "object-cover object-top" : "object-contain")}
        />
      ) : null}
    </div>
  );

  const copy = (
    <div className="flex flex-col gap-2 px-3 text-body">
      <p className="text-white">{title}</p>
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-2 text-muted">
          {meta.map((item) => (
            <span key={item}>{item}</span>
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
        className="flex w-full flex-col gap-4 rounded-card bg-sunken p-6 text-left"
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
