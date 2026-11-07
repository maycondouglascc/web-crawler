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

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h3 className="text-body text-white">Colors</h3>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => copyToClipboard(color.value)}
              className="flex flex-col gap-4 rounded-card bg-sunken p-6 text-left"
            >
              <div className="h-16 w-full rounded-control border border-line" style={{ backgroundColor: color.value }} />
              <div className="flex flex-col gap-2 px-3">
                <p className="text-body text-white">{color.value}</p>
                <p className="text-body text-muted">
                  {copiedVal === color.value ? "Copied" : color.name} {color.usage_count}x
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-body text-white">Typography</h3>
        <div className="flex flex-col gap-2">
          {typography.map((token) => (
            <div key={token.id} className="flex flex-col gap-2 rounded-card bg-sunken p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-body text-white">The quick brown fox jumps over the lazy dog</p>
              <p className="text-body text-muted">
                {token.name} {token.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h3 className="text-body text-white">Radius</h3>
          <div className="grid grid-cols-2 gap-6">
            {radii.map((token) => (
              <div key={token.id} className="flex flex-col items-start gap-4 rounded-card bg-sunken p-6">
                <div className="h-12 w-12 border border-white" style={{ borderRadius: token.value }} />
                <p className="text-body text-muted">{token.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-body text-white">Shadows</h3>
          <div className="flex flex-col gap-2">
            {shadows.map((token) => (
              <div key={token.id} className="flex items-center justify-between gap-4 rounded-card bg-sunken p-6">
                <div className="h-10 w-10 rounded-control bg-media" style={{ boxShadow: token.value }} />
                <p className="truncate text-label text-muted">{token.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
