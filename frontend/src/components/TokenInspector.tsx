import React, { useState } from 'react';
import { Palette, Type, Square, Layers, Copy, Check } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      {/* 1. Color Palette */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-emerald-400" />
          <h3 className="text-base font-bold text-white">Extracted Color Palette</h3>
          <span className="text-xs text-slate-500 font-mono">({colors.length} tokens)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {colors.map((c) => (
            <div
              key={c.id}
              onClick={() => copyToClipboard(c.value)}
              className="group p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-md flex flex-col justify-between"
            >
              <div
                className="w-full h-16 rounded-xl border border-white/10 shadow-inner mb-3 transition group-hover:scale-[1.03]"
                style={{ backgroundColor: c.value }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-semibold text-slate-200">{c.value}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{c.name} • {c.usage_count}x</div>
                </div>
                <div className="text-slate-500 group-hover:text-emerald-400 transition">
                  {copiedVal === c.value ? <Check size={14} className="text-emerald-400" /> : <Copy size={13} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Typography Scale */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-emerald-400" />
          <h3 className="text-base font-bold text-white">Typography Scale</h3>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
          {typography.map((t) => (
            <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-mono font-bold text-emerald-400 uppercase">
                  {t.name}
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  The quick brown fox jumps over the lazy dog
                </span>
              </div>
              <div className="font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                {t.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Border Radii & Box Shadows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radii */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Square size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white">Border Radii</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {radii.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-3"
              >
                <div
                  className="w-12 h-12 bg-emerald-500/10 border-2 border-emerald-500/40"
                  style={{ borderRadius: r.value }}
                />
                <span className="font-mono text-xs text-slate-300 font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" />
            <h3 className="text-base font-bold text-white">Box Shadows</h3>
          </div>
          <div className="space-y-3">
            {shadows.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div
                  className="w-10 h-10 rounded-lg bg-slate-800"
                  style={{ boxShadow: s.value }}
                />
                <div className="font-mono text-[11px] text-slate-400 truncate max-w-xs">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
