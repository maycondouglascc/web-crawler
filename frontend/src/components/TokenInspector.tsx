import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TokenItem {
  id: string;
  category: 'color' | 'typography' | 'radius' | 'shadow';
  name: string;
  value: string;
  usage_count: number;
}

interface TokenInspectorProps {
  tokens: TokenItem[];
}

export const TokenInspector: React.FC<TokenInspectorProps> = ({ tokens }) => {
  const [copiedVal, setCopiedVal] = useState<string | null>(null);

  const colors = tokens.filter((t) => t.category === 'color');
  const typography = tokens.filter((t) => t.category === 'typography');
  const radii = tokens.filter((t) => t.category === 'radius');
  const shadows = tokens.filter((t) => t.category === 'shadow');

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVal(val);
    setTimeout(() => setCopiedVal(null), 1500);
  };

  if (tokens.length === 0) {
    return (
      <div className="bg-[#0C0D0D] rounded-[24px] p-12 text-center text-[16px] leading-[24px] text-[#7E7E81]">
        No design tokens extracted for this crawl yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Color Palette — Matching Figma 3-column / 4-column Card Language */}
      {colors.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[24px] leading-[32px] font-bold text-white">Colors</h3>
            <span className="text-[16px] leading-[24px] text-[#7E7E81]">{colors.length} tokens</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {colors.map((c) => (
              <div
                key={c.id}
                onClick={() => copyToClipboard(c.value)}
                className="group bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-4 border border-transparent hover:border-[#242628] cursor-pointer transition"
              >
                <div
                  className="w-full h-[140px] rounded-[12px] border border-white/10 transition group-hover:scale-[1.01]"
                  style={{ backgroundColor: c.value }}
                />
                <div className="px-3 flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[16px] leading-[24px] text-white">{c.value}</span>
                    <div className="flex items-center gap-2 text-[14px] leading-[20px] text-[#7E7E81]">
                      <span className="capitalize">{c.name}</span>
                      <span>•</span>
                      <span>{c.usage_count}x</span>
                    </div>
                  </div>
                  <div className="text-[#7E7E81] group-hover:text-white transition">
                    {copiedVal === c.value ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Typography Scale */}
      {typography.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[24px] leading-[32px] font-bold text-white">Typography</h3>
            <span className="text-[16px] leading-[24px] text-[#7E7E81]">{typography.length} styles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {typography.map((t) => (
              <div
                key={t.id}
                onClick={() => copyToClipboard(t.value)}
                className="bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col justify-between gap-4 border border-transparent hover:border-[#242628] cursor-pointer transition"
              >
                <div className="bg-[#1D1D1E] rounded-[12px] p-6 flex items-center justify-between">
                  <span className="text-[20px] leading-[28px] text-white font-medium truncate">
                    Aa Bb Cc — {t.name}
                  </span>
                  <span className="text-[#7E7E81] shrink-0 ml-3">
                    {copiedVal === t.value ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                  </span>
                </div>

                <div className="px-3 flex flex-col gap-1">
                  <span className="text-[16px] leading-[24px] text-white">{t.name}</span>
                  <span className="font-mono text-[14px] leading-[20px] text-[#7E7E81]">{t.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Border Radii & Box Shadows */}
      {(radii.length > 0 || shadows.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {radii.length > 0 && (
            <div className="bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-6">
              <div className="px-3 flex items-baseline justify-between">
                <h3 className="text-[20px] leading-[28px] font-bold text-white">Border radii</h3>
                <span className="text-[14px] text-[#7E7E81]">{radii.length} tokens</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {radii.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => copyToClipboard(r.value)}
                    className="bg-[#1D1D1E] hover:bg-[#242628] rounded-[12px] p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition"
                  >
                    <div
                      className="w-12 h-12 bg-[#0C0D0D] border border-white/40"
                      style={{ borderRadius: r.value }}
                    />
                    <span className="font-mono text-[14px] text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shadows.length > 0 && (
            <div className="bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-6">
              <div className="px-3 flex items-baseline justify-between">
                <h3 className="text-[20px] leading-[28px] font-bold text-white">Elevations & shadows</h3>
                <span className="text-[14px] text-[#7E7E81]">{shadows.length} tokens</span>
              </div>
              <div className="flex flex-col gap-3">
                {shadows.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => copyToClipboard(s.value)}
                    className="bg-[#1D1D1E] hover:bg-[#242628] rounded-[12px] p-4 flex items-center justify-between gap-4 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-10 h-10 rounded-[8px] bg-[#252627] shrink-0 border border-white/10"
                        style={{ boxShadow: s.value }}
                      />
                      <span className="font-mono text-[13px] text-[#7E7E81] truncate">{s.value}</span>
                    </div>
                    <span className="text-[#7E7E81] shrink-0">
                      {copiedVal === s.value ? <Check size={15} className="text-white" /> : <Copy size={15} />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
