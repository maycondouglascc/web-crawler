import React, { useState } from "react";
import { CheckSquare, ChevronDown, ChevronRight, MinusSquare, Square } from "lucide-react";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";

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
  onProceedToCapture: (config: {
    runId: string;
    viewports: { desktop: boolean; mobile: boolean; tablet: boolean; ultrawide: boolean };
    themes: { light: boolean; dark: boolean };
    include_fold: boolean;
  }) => void;
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

  const totalDiscovered = patterns.reduce((sum, group) => sum + group.total_routes, 0);
  const totalSelected = patterns.reduce((sum, group) => sum + group.selected_count, 0);

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-body text-white">
            {totalDiscovered} routes across {patterns.length} patterns
          </h2>
          <p className="text-body text-muted">
            Dynamic routes keep one representative sample so the crawl does not loop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="px-3 text-body text-muted">{totalSelected} queued</p>
          <Button onClick={handleLaunchCapture} disabled={totalSelected === 0}>
            Start capture
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip label="Desktop" kind={includeDesktop ? "filled" : "outline"} onClick={() => setIncludeDesktop(!includeDesktop)} />
        <Chip label="Mobile" kind={includeMobile ? "filled" : "outline"} onClick={() => setIncludeMobile(!includeMobile)} />
        <Chip label="Tablet" kind={includeTablet ? "filled" : "outline"} onClick={() => setIncludeTablet(!includeTablet)} />
        <Chip label="Ultrawide" kind={includeUltrawide ? "filled" : "outline"} onClick={() => setIncludeUltrawide(!includeUltrawide)} />
        <Chip label="Light" kind={includeLight ? "filled" : "outline"} onClick={() => setIncludeLight(!includeLight)} />
        <Chip label="Dark" kind={includeDark ? "filled" : "outline"} onClick={() => setIncludeDark(!includeDark)} />
        <Chip label="Above the fold" kind={includeFold ? "filled" : "outline"} onClick={() => setIncludeFold(!includeFold)} />
      </div>

      <div className="flex flex-col gap-2">
        {patterns.map((group) => {
          const isExpanded = !!expandedPatterns[group.pattern];
          const allSelected = group.selected_count === group.total_routes;
          const someSelected = group.selected_count > 0 && !allSelected;

          return (
            <div key={group.pattern} className="overflow-hidden rounded-card bg-sunken">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    type="button"
                    aria-label={allSelected ? "Deselect pattern" : "Select pattern"}
                    onClick={() => onTogglePattern(group.pattern, !allSelected)}
                    className="text-white"
                  >
                    {allSelected ? (
                      <CheckSquare size={24} />
                    ) : someSelected ? (
                      <MinusSquare size={24} />
                    ) : (
                      <Square size={24} className="text-muted" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-body text-white">{group.pattern}</p>
                    <p className="text-label text-muted">
                      {group.selected_count} of {group.total_routes} selected
                    </p>
                  </div>
                </div>
                {group.total_routes > 1 && (
                  <button
                    type="button"
                    aria-label={isExpanded ? "Collapse routes" : "Expand routes"}
                    onClick={() => setExpandedPatterns((prev) => ({ ...prev, [group.pattern]: !prev[group.pattern] }))}
                    className="text-white"
                  >
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                )}
              </div>

              {(isExpanded || group.total_routes === 1) && (
                <div className="flex flex-col border-t border-line">
                  {group.routes.map((route) => (
                    <div key={route.id} className="flex items-center justify-between gap-4 px-6 py-3">
                      <div className="flex min-w-0 items-center gap-4">
                        <button
                          type="button"
                          aria-label={route.is_selected ? "Deselect route" : "Select route"}
                          onClick={() => onToggleRoute(route.id, route.is_selected)}
                          className="text-white"
                        >
                          {route.is_selected ? <CheckSquare size={24} /> : <Square size={24} className="text-muted" />}
                        </button>
                        <p className="truncate text-body text-white">{route.path}</p>
                        {route.is_sample && group.total_routes > 1 && <span className="text-label text-muted">Sample</span>}
                      </div>
                      <p className="hidden max-w-xs truncate text-label text-subtle md:block">{route.full_url}</p>
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
