import React, { useState } from "react";

interface TokenItem {
  id: string;
  category: "color" | "typography" | "radius" | "shadow";
  name: string;
  value: string;
  usage_count: number;
}

interface TokenInspectorProps {
  tokens: TokenItem[];
}

export const TokenInspector: React.FC<TokenInspectorProps> = ({ tokens }) => {
  const [copiedVal, setCopiedVal] = useState<string | null>(null);

  const colors = tokens.filter((token) => token.category === "color");
  const typography = tokens.filter((token) => token.category === "typography");
  const radii = tokens.filter((token) => token.category === "radius");
  const shadows = tokens.filter((token) => token.category === "shadow");

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedVal(value);
    window.setTimeout(() => setCopiedVal(null), 1500);
  };

  if (tokens.length === 0) {
    return <p className="rounded-card bg-sunken p-6 text-body text-muted">No design tokens extracted for this crawl yet.</p>;
  }

  return (
    <div className="flex flex-col gap-10">
      {colors.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-body text-white">Colors</h3>
            <span className="text-label text-muted">{colors.length} tokens</span>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => copyToClipboard(color.value)}
                className="flex flex-col gap-4 rounded-card bg-sunken p-6 text-left transition hover:bg-[#101112]"
              >
                <div className="h-24 w-full rounded-control border border-line" style={{ backgroundColor: color.value }} />
                <div className="flex flex-col gap-2 px-3">
                  <p className="font-mono text-body text-white">{color.value}</p>
                  <p className="text-body text-muted">
                    {copiedVal === color.value ? "Copied" : `${color.name}  ${color.usage_count}x`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {typography.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-body text-white">Typography</h3>
            <span className="text-label text-muted">{typography.length} styles</span>
          </div>
          <div className="flex flex-col gap-2">
            {typography.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => copyToClipboard(token.value)}
                className="flex flex-col gap-2 rounded-card bg-sunken p-6 text-left transition hover:bg-[#101112] md:flex-row md:items-center md:justify-between"
              >
                <p className="text-body text-white">The quick brown fox jumps over the lazy dog</p>
                <p className="font-mono text-label text-muted">
                  {copiedVal === token.value ? "Copied" : `${token.name} — ${token.value}`}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {(radii.length > 0 || shadows.length > 0) && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {radii.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-body text-white">Radius</h3>
                <span className="text-label text-muted">{radii.length} tokens</span>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {radii.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => copyToClipboard(token.value)}
                    className="flex flex-col items-start gap-4 rounded-card bg-sunken p-6 text-left transition hover:bg-[#101112]"
                  >
                    <div className="h-12 w-12 border border-white bg-media" style={{ borderRadius: token.value }} />
                    <p className="font-mono text-body text-muted">
                      {copiedVal === token.value ? "Copied" : token.value}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {shadows.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-body text-white">Shadows</h3>
                <span className="text-label text-muted">{shadows.length} tokens</span>
              </div>
              <div className="flex flex-col gap-2">
                {shadows.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => copyToClipboard(token.value)}
                    className="flex items-center justify-between gap-4 rounded-card bg-sunken p-6 text-left transition hover:bg-[#101112]"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-control bg-media" style={{ boxShadow: token.value }} />
                    <p className="truncate font-mono text-label text-muted">
                      {copiedVal === token.value ? "Copied" : token.value}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
