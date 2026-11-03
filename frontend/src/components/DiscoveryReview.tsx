import React, { useState } from 'react';
import { Layers, CheckSquare, Square, ChevronDown, ChevronRight, Sparkles, Monitor, Smartphone, Moon, Sun, ArrowRight } from 'lucide-react';

interface RouteItem {
  id: string;
  path: string;
  full_url: string;
  pattern: string;
  is_selected: boolean;
  is_sample: boolean;
  sample_count_in_pattern: number;
}

interface PatternGroup {
  pattern: string;
  total_routes: number;
  selected_count: number;
  sample_path: string;
  routes: RouteItem[];
}

interface DiscoveryReviewProps {
  runId: string;
  patterns: PatternGroup[];
  onToggleRoute: (routeId: string, currentSelected: boolean) => void;
  onTogglePattern: (pattern: string, selectAll: boolean) => void;
  onProceedToCapture: (config: any) => void;
}

export const DiscoveryReview: React.FC<DiscoveryReviewProps> = ({
  runId,
  patterns,
  onToggleRoute,
  onTogglePattern,
  onProceedToCapture,
}) => {
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});
  const [includeLight, setIncludeLight] = useState(true);
  const [includeDark, setIncludeDark] = useState(true);
  const [includeDesktop, setIncludeDesktop] = useState(true);
  const [includeMobile, setIncludeMobile] = useState(true);
  const [includeTablet, setIncludeTablet] = useState(false);
  const [includeUltrawide, setIncludeUltrawide] = useState(false);
  const [includeFold, setIncludeFold] = useState(false);

  const toggleExpand = (pattern: string) => {
    setExpandedPatterns((prev) => ({ ...prev, [pattern]: !prev[pattern] }));
  };

  const totalDiscovered = patterns.reduce((sum, p) => sum + p.total_routes, 0);
  const totalSelected = patterns.reduce((sum, p) => sum + p.selected_count, 0);

  const handleLaunchCapture = () => {
    onProceedToCapture({
      runId,
      viewports: {
        desktop: includeDesktop,
        mobile: includeMobile,
        tablet: includeTablet,
        ultrawide: includeUltrawide,
      },
      themes: {
        light: includeLight,
        dark: includeDark,
      },
      include_fold: includeFold,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Stats & Config Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles size={14} />
            Smart Discovery & Pattern Deduplication
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {totalDiscovered} Routes Discovered across {patterns.length} Patterns
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic routes (e.g. <span className="font-mono text-emerald-400">/projects/:id</span>) have 1 representative sample pre-selected to prevent infinite crawls.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalSelected}</div>
            <div className="text-xs text-slate-400">Routes Queued</div>
          </div>
          <button
            onClick={handleLaunchCapture}
            disabled={totalSelected === 0}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-semibold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <span>Proceed to Capture</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Preset Viewport & Theme Selector */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Capture Matrix:</span>

          {/* Viewports */}
          <button
            onClick={() => setIncludeDesktop(!includeDesktop)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeDesktop ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Monitor size={14} />
            Desktop (1440px)
          </button>
          <button
            onClick={() => setIncludeMobile(!includeMobile)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeMobile ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Smartphone size={14} />
            Mobile (375px)
          </button>
          <button
            onClick={() => setIncludeTablet(!includeTablet)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeTablet ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            Tablet (768px)
          </button>
          <button
            onClick={() => setIncludeUltrawide(!includeUltrawide)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeUltrawide ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            Ultrawide (1920px)
          </button>
        </div>

        {/* Themes */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <button
            onClick={() => setIncludeLight(!includeLight)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeLight ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Sun size={14} />
            Light Mode
          </button>
          <button
            onClick={() => setIncludeDark(!includeDark)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Moon size={14} />
            Dark Mode
          </button>
        </div>

        {/* Capture Scope (Full Page vs Fold) */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <button
            onClick={() => setIncludeFold(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              !includeFold ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>Full Page Only (Default)</span>
          </button>
          <button
            onClick={() => setIncludeFold(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
              includeFold ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>+ Fold Screen</span>
          </button>
        </div>
      </div>

      {/* Pattern Groups List */}
      <div className="space-y-3">
        {patterns.map((grp) => {
          const isExpanded = !!expandedPatterns[grp.pattern];
          const allSelected = grp.selected_count === grp.total_routes;
          const someSelected = grp.selected_count > 0 && !allSelected;

          return (
            <div
              key={grp.pattern}
              className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden transition"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-900 transition">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onTogglePattern(grp.pattern, !allSelected)}
                    className="text-slate-400 hover:text-emerald-400 transition"
                  >
                    {allSelected ? (
                      <CheckSquare size={18} className="text-emerald-400" />
                    ) : someSelected ? (
                      <div className="w-[18px] h-[18px] rounded border border-emerald-400 bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-emerald-400" />
                      </div>
                    ) : (
                      <Square size={18} />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-100">{grp.pattern}</span>
                    {grp.total_routes > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-400 border border-slate-700">
                        {grp.total_routes} instances
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{grp.selected_count}</span> of {grp.total_routes} selected
                  </div>

                  {grp.total_routes > 1 && (
                    <button
                      onClick={() => toggleExpand(grp.pattern)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-routes (Expanded or Single) */}
              {(isExpanded || grp.total_routes === 1) && (
                <div className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {grp.routes.map((rt) => (
                    <div
                      key={rt.id}
                      className="flex items-center justify-between px-6 py-2.5 hover:bg-slate-900/30 transition text-xs"
                    >
                      <div className="flex items-center gap-3 pl-2">
                        <button
                          onClick={() => onToggleRoute(rt.id, rt.is_selected)}
                          className="text-slate-500 hover:text-emerald-400 transition"
                        >
                          {rt.is_selected ? (
                            <CheckSquare size={16} className="text-emerald-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                        <span className="font-mono text-slate-300">{rt.path}</span>
                        {rt.is_sample && grp.total_routes > 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                            Representative Sample
                          </span>
                        )}
                        {!rt.is_sample && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 font-mono text-[10px]">
                            Pattern Duplicate
                          </span>
                        )}
                      </div>

                      <div className="text-slate-500 font-mono text-[11px] truncate max-w-xs">
                        {rt.full_url}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
