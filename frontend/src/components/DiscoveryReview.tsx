import React, { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react';

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
  siteName?: string;
  baseUrl?: string;
  patterns: PatternGroup[];
  onToggleRoute: (routeId: string, currentSelected: boolean) => void;
  onTogglePattern: (pattern: string, selectAll: boolean) => void;
  onProceedToCapture: (config: any) => void;
  onBack?: () => void;
}

export const DiscoveryReview: React.FC<DiscoveryReviewProps> = ({
  runId,
  siteName,
  baseUrl,
  patterns,
  onToggleRoute,
  onTogglePattern,
  onProceedToCapture,
  onBack,
}) => {
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});
  const [includeLight, setIncludeLight] = useState(true);
  const [includeDark, setIncludeDark] = useState(false);
  const [includeDesktop, setIncludeDesktop] = useState(true);
  const [includeMobile, setIncludeMobile] = useState(true);
  const [includeTablet, setIncludeTablet] = useState(false);
  const [includeUltrawide, setIncludeUltrawide] = useState(false);
  const [includeFold, setIncludeFold] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

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

  const selectAllRoutes = (select: boolean) => {
    patterns.forEach((p) => {
      onTogglePattern(p.pattern, select);
    });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Top Back Button */}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-[12px] hover:bg-[#242628]/60 flex items-center justify-center transition cursor-pointer"
            title="Back to My crawls"
          >
            <img src="/assets/figma/icon-back.svg" width={24} height={24} alt="Back" />
          </button>
        </div>
      )}

      {/* Header Row matching Wireframe - 3 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-[560px]">
          <h1 className="text-[32px] leading-[40px] font-bold text-white tracking-tight">
            {siteName || 'Review discovered routes'}
          </h1>
          <p className="text-[16px] leading-[24px] text-[#7E7E81]">
            {totalDiscovered} routes discovered across {patterns.length} URL patterns
            {baseUrl ? ` on ${baseUrl}` : ''}. Dynamic patterns pre-select 1 sample to keep your crawl fast and clean.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => selectAllRoutes(totalSelected < totalDiscovered)}
            className="px-4 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 text-[16px] leading-[24px] text-white transition cursor-pointer"
          >
            {totalSelected === totalDiscovered ? 'Deselect all' : 'Select all'}
          </button>

          <button
            onClick={handleLaunchCapture}
            disabled={totalSelected === 0 || (!includeDesktop && !includeMobile && !includeTablet && !includeUltrawide) || (!includeLight && !includeDark)}
            className="px-6 py-3 rounded-[12px] bg-white hover:bg-white/90 disabled:opacity-40 text-[16px] leading-[24px] text-[#262627] font-normal transition cursor-pointer"
          >
            Capture {totalSelected} {totalSelected === 1 ? 'route' : 'routes'}
          </button>
        </div>
      </div>

      {/* Capture Matrix Chips Row matching Wireframe - 3 Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`px-4 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer ${
              showConfigPanel ? 'bg-[#242628]/60' : ''
            }`}
          >
            <img src="/assets/figma/icon-filter.svg" width={24} height={24} alt="" />
            <span>Capture settings</span>
          </button>

          {/* Active Viewport Chips */}
          {includeDesktop && (
            <button
              onClick={() => {
                if (includeMobile || includeTablet || includeUltrawide) setIncludeDesktop(false);
              }}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
              title="Click to remove Desktop viewport"
            >
              <span>Desktop</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {includeMobile && (
            <button
              onClick={() => {
                if (includeDesktop || includeTablet || includeUltrawide) setIncludeMobile(false);
              }}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
              title="Click to remove Mobile viewport"
            >
              <span>Mobile</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {includeTablet && (
            <button
              onClick={() => setIncludeTablet(false)}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
            >
              <span>Tablet</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {includeUltrawide && (
            <button
              onClick={() => setIncludeUltrawide(false)}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
            >
              <span>Ultrawide</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {/* Active Theme Chips */}
          {includeLight && (
            <button
              onClick={() => {
                if (includeDark) setIncludeLight(false);
              }}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
            >
              <span>Light</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {includeDark && (
            <button
              onClick={() => {
                if (includeLight) setIncludeDark(false);
              }}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
            >
              <span>Dark</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}

          {includeFold && (
            <button
              onClick={() => setIncludeFold(false)}
              className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
            >
              <span>+ Above the fold</span>
              <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
            </button>
          )}
        </div>

        {/* Expandable Settings Popover Bar */}
        {showConfigPanel && (
          <div className="p-6 rounded-[24px] bg-[#0C0D0D] border border-[#242628] flex flex-wrap items-center gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] text-[#7E7E81]">Viewports</span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Desktop (1440px)', active: includeDesktop, toggle: () => setIncludeDesktop(!includeDesktop) },
                  { label: 'Mobile (375px)', active: includeMobile, toggle: () => setIncludeMobile(!includeMobile) },
                  { label: 'Tablet (768px)', active: includeTablet, toggle: () => setIncludeTablet(!includeTablet) },
                  { label: 'Ultrawide (1920px)', active: includeUltrawide, toggle: () => setIncludeUltrawide(!includeUltrawide) },
                ].map((vp) => (
                  <button
                    key={vp.label}
                    onClick={vp.toggle}
                    className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                      vp.active
                        ? 'bg-white text-[#262627] font-medium'
                        : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                    }`}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[14px] text-[#7E7E81]">Color themes</span>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Light', active: includeLight, toggle: () => setIncludeLight(!includeLight) },
                  { label: 'Dark', active: includeDark, toggle: () => setIncludeDark(!includeDark) },
                ].map((th) => (
                  <button
                    key={th.label}
                    onClick={th.toggle}
                    className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                      th.active
                        ? 'bg-white text-[#262627] font-medium'
                        : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[14px] text-[#7E7E81]">Capture mode</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIncludeFold(false)}
                  className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                    !includeFold
                      ? 'bg-white text-[#262627] font-medium'
                      : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                  }`}
                >
                  Full page only
                </button>
                <button
                  onClick={() => setIncludeFold(true)}
                  className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                    includeFold
                      ? 'bg-white text-[#262627] font-medium'
                      : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                  }`}
                >
                  Full page + Fold
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Pattern Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patterns.map((grp) => {
          const isExpanded = !!expandedPatterns[grp.pattern];
          const allSelected = grp.selected_count === grp.total_routes;
          const someSelected = grp.selected_count > 0 && !allSelected;

          return (
            <div
              key={grp.pattern}
              className="bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col justify-between gap-4 border border-transparent hover:border-[#242628] transition"
            >
              <div className="flex flex-col gap-4">
                {/* Visual Route Pattern Box */}
                <div
                  onClick={() => onTogglePattern(grp.pattern, !allSelected)}
                  className="bg-[#1D1D1E] rounded-[12px] p-5 flex flex-col justify-between min-h-[140px] cursor-pointer group transition hover:bg-[#242628]"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-[8px] bg-[#0C0D0D] text-[13px] font-mono text-[#7E7E81]">
                      {grp.total_routes === 1 ? 'Static route' : `${grp.total_routes} dynamic routes`}
                    </span>

                    <div
                      className={`w-6 h-6 rounded-[8px] flex items-center justify-center transition ${
                        allSelected || someSelected
                          ? 'bg-white text-[#262627]'
                          : 'border border-[#7E7E81]/50 text-transparent group-hover:border-white'
                      }`}
                    >
                      {allSelected ? <Check size={15} strokeWidth={2.5} /> : someSelected ? <Minus size={15} strokeWidth={2.5} /> : null}
                    </div>
                  </div>

                  <div className="font-mono text-[18px] leading-[26px] text-white break-all">
                    {grp.pattern}
                  </div>
                </div>

                {/* Title & Metadata matching Figma Card layout */}
                <div className="px-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[16px] leading-[24px] text-white truncate">
                      {grp.sample_path === '/' ? 'Home (/)' : grp.sample_path}
                    </span>
                    {grp.total_routes > 1 && (
                      <button
                        onClick={() => toggleExpand(grp.pattern)}
                        className="text-[14px] text-[#7E7E81] hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Routes'}</span>
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[16px] leading-[24px] text-[#7E7E81] flex-wrap">
                    <span>{grp.selected_count} of {grp.total_routes} selected</span>
                    {grp.total_routes > 1 && (
                      <>
                        <span>•</span>
                        <span>1 sample active</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Sub-routes if multi-route pattern */}
              {isExpanded && grp.total_routes > 1 && (
                <div className="pt-3 border-t border-[#242628] flex flex-col gap-1.5 max-h-48 overflow-y-auto px-2">
                  {grp.routes.map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() => onToggleRoute(rt.id, rt.is_selected)}
                      className="flex items-center justify-between py-2 px-2.5 rounded-[10px] hover:bg-[#1D1D1E] text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0 ${
                            rt.is_selected ? 'bg-white text-[#262627]' : 'border border-[#7E7E81]'
                          }`}
                        >
                          {rt.is_selected && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="font-mono text-[13px] text-white truncate">{rt.path}</span>
                      </div>
                      {rt.is_sample && (
                        <span className="text-[12px] text-[#7E7E81] shrink-0 ml-2">Sample</span>
                      )}
                    </button>
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
