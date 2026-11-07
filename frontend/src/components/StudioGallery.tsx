import React, { useState, useEffect } from 'react';
import {
  Download, X, Maximize2, Minimize2, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { TokenInspector } from './TokenInspector';
import { ExportDrawer } from './ExportDrawer';

interface ScreenItem {
  id: string;
  route_path: string;
  viewport_label: string;
  width: number;
  height: number;
  theme: string;
  capture_type: string;
  url: string;
}

interface SectionItem {
  id: string;
  route_path: string;
  section_category: string;
  viewport_label: string;
  width: number;
  height: number;
  theme: string;
  url: string;
}

interface ModalItem {
  id: string;
  route_path: string;
  section_category: string;
  file_path: string;
  url: string;
}

interface ComponentItem {
  id: string;
  fingerprint: string;
  category: string;
  instances_count: number;
  url: string;
  html_snippet?: string;
  computed_styles?: Record<string, string>;
  routes?: string[];
}

interface LightboxItem {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  route_path?: string;
  type: 'screen' | 'section' | 'modal';
}

interface StudioGalleryProps {
  runId: string;
  siteName?: string;
  baseUrl?: string;
  screens: ScreenItem[];
  sections: SectionItem[];
  modals?: ModalItem[];
  components: ComponentItem[];
  tokens?: any[];
  onReset?: () => void;
  onRecapture?: (routePaths: string[]) => void;
  isLiveCapturing?: boolean;
}

function formatRouteTitle(routePath: string): string {
  if (!routePath || routePath === '/') return 'Home (/)';
  const cleaned = routePath.replace(/^\/+/, '').replace(/[-_]/g, ' ');
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${capitalized} (${routePath})`;
}

function capitalizeWord(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const StudioGallery: React.FC<StudioGalleryProps> = ({
  runId,
  siteName = 'Site name',
  baseUrl = '',
  screens,
  sections,
  modals = [],
  components,
  tokens = [],
  onReset,
  onRecapture,
  isLiveCapturing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'screens' | 'sections' | 'modals' | 'components' | 'tokens'>('screens');
  const [viewportFilter, setViewportFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [foldFilter, setFoldFilter] = useState<string>('full_page');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Interactive Lightbox State
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);

  // Component Inspector State
  const [componentIndex, setComponentIndex] = useState<number | null>(null);

  // Recapture Picker Modal State
  const [isRecaptureModalOpen, setIsRecaptureModalOpen] = useState(false);
  const [selectedRecaptureRoutes, setSelectedRecaptureRoutes] = useState<Record<string, boolean>>({});

  // Export Modal State
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);

  // Filter logic
  const filteredScreens = screens.filter((s) => {
    if (viewportFilter !== 'all' && s.viewport_label !== viewportFilter) return false;
    if (themeFilter !== 'all' && s.theme !== themeFilter) return false;
    if (foldFilter !== 'all' && s.capture_type !== foldFilter) return false;
    return true;
  });

  const filteredSections = sections.filter((sec) => {
    if (viewportFilter !== 'all' && sec.viewport_label !== viewportFilter) return false;
    if (themeFilter !== 'all' && sec.theme !== themeFilter) return false;
    if (categoryFilter !== 'all' && sec.section_category !== categoryFilter) return false;
    return true;
  });

  const filteredComponents = components.filter((c) => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    return true;
  });

  const availableViewports = Array.from(new Set(screens.map((s) => s.viewport_label).filter(Boolean)));
  const availableThemes = Array.from(new Set(screens.map((s) => s.theme).filter(Boolean)));
  const sectionCategories = Array.from(new Set(sections.map((s) => s.section_category).filter(Boolean)));
  const componentCategories = Array.from(new Set(components.map((c) => c.category).filter(Boolean)));
  const allUniqueRoutes = Array.from(new Set(screens.map((s) => s.route_path))).sort();

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null && lightboxItems.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null ? (prev - 1 + lightboxItems.length) % lightboxItems.length : 0));
          setZoomLevel(1.0);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null ? (prev + 1) % lightboxItems.length : 0));
          setZoomLevel(1.0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setLightboxIndex(null);
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoomLevel((z) => Math.min(4.0, +(z + 0.25).toFixed(2)));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1.0);
          setIsFitMode(true);
        }
      }

      if (componentIndex !== null && filteredComponents.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setComponentIndex((prev) => (prev !== null ? (prev - 1 + filteredComponents.length) % filteredComponents.length : 0));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setComponentIndex((prev) => (prev !== null ? (prev + 1) % filteredComponents.length : 0));
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setComponentIndex(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, lightboxItems, componentIndex, filteredComponents]);

  // Open Lightbox Helpers
  const openScreenLightbox = (index: number) => {
    const items: LightboxItem[] = filteredScreens.map((s) => ({
      id: s.id,
      url: s.url,
      title: formatRouteTitle(s.route_path),
      subtitle: `${capitalizeWord(s.viewport_label)} • ${s.width}×${s.height} • ${capitalizeWord(s.theme)}`,
      route_path: s.route_path,
      type: 'screen',
    }));
    setLightboxItems(items);
    setLightboxIndex(index);
    setZoomLevel(1.0);
    setIsFitMode(true);
  };

  const openSectionLightbox = (index: number) => {
    const items: LightboxItem[] = filteredSections.map((sec) => ({
      id: sec.id,
      url: sec.url,
      title: `${capitalizeWord(sec.section_category)} (${sec.route_path})`,
      subtitle: `${capitalizeWord(sec.viewport_label)} • ${sec.width}×${sec.height} • ${capitalizeWord(sec.theme)}`,
      route_path: sec.route_path,
      type: 'section',
    }));
    setLightboxItems(items);
    setLightboxIndex(index);
    setZoomLevel(1.0);
    setIsFitMode(true);
  };

  const openModalLightbox = (index: number) => {
    const items: LightboxItem[] = modals.map((m) => ({
      id: m.id,
      url: m.url,
      title: m.section_category.replace('modal_', 'Modal: '),
      subtitle: m.route_path,
      route_path: m.route_path,
      type: 'modal',
    }));
    setLightboxItems(items);
    setLightboxIndex(index);
    setZoomLevel(1.0);
    setIsFitMode(true);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || isFitMode) {
      if (e.deltaY < 0) {
        setZoomLevel((z) => Math.min(4.0, +(z + 0.15).toFixed(2)));
      } else {
        setZoomLevel((z) => Math.max(0.5, +(z - 0.15).toFixed(2)));
      }
    }
  };

  const currentLightboxItem = lightboxIndex !== null && lightboxItems[lightboxIndex] ? lightboxItems[lightboxIndex] : null;
  const currentComponent = componentIndex !== null && filteredComponents[componentIndex] ? filteredComponents[componentIndex] : null;

  const handleOpenRecaptureModal = () => {
    const initial: Record<string, boolean> = {};
    allUniqueRoutes.forEach((r) => {
      initial[r] = true;
    });
    setSelectedRecaptureRoutes(initial);
    setIsRecaptureModalOpen(true);
  };

  const handleExecuteRecapture = () => {
    if (!onRecapture) return;
    const paths = Object.entries(selectedRecaptureRoutes)
      .filter(([_, isSel]) => isSel)
      .map(([path, _]) => path);

    if (paths.length > 0) {
      setIsRecaptureModalOpen(false);
      onRecapture(paths);
    }
  };

  const triggerDirectDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/runs/${runId}/exports/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build site summary string matching Figma #30:199
  const summaryParts: string[] = [];
  if (baseUrl) summaryParts.push(baseUrl);
  summaryParts.push(`${screens.length} screens`);
  if (sections.length > 0) summaryParts.push(`${sections.length} sections`);
  if (components.length > 0) summaryParts.push(`${components.length} components`);
  if (tokens.length > 0) summaryParts.push(`${tokens.length} tokens`);
  const siteSummary = summaryParts.join(' • ');

  return (
    <div className="flex flex-col gap-10">
      {/* 1. Back Icon Button (#30:194) */}
      {onReset && (
        <div>
          <button
            onClick={onReset}
            className="w-10 h-10 -ml-2 rounded-[12px] hover:bg-[#242628]/60 flex items-center justify-center transition cursor-pointer"
            title="Back to My crawls"
          >
            <img src="/assets/figma/icon-back.svg" width={24} height={24} alt="Back" />
          </button>
        </div>
      )}

      {/* 2. Site Header Row (#30:196) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-[540px]">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[32px] leading-[40px] font-bold text-white tracking-tight">
              {siteName}
            </h1>
            {isLiveCapturing && (
              <span className="px-3 py-1 rounded-[12px] bg-[#252627] text-[13px] text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Capturing live...
              </span>
            )}
          </div>
          <p className="text-[16px] leading-[24px] text-[#7E7E81]">
            {siteSummary}
          </p>
        </div>

        {/* Right Action Row (#30:200) */}
        <div className="flex items-center gap-2 flex-wrap">
          {onRecapture && (
            <button
              onClick={handleOpenRecaptureModal}
              className="px-4 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 flex items-center justify-center transition cursor-pointer"
              title="Recapture pages"
            >
              <img src="/assets/figma/icon-refresh.svg" width={25} height={24} alt="Recapture" />
            </button>
          )}

          <button
            onClick={() => triggerDirectDownload('DESIGN_SYSTEM.md')}
            className="px-4 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 text-[16px] leading-[24px] text-white transition cursor-pointer"
          >
            Export design.md
          </button>

          <button
            onClick={() => triggerDirectDownload('images.zip')}
            className="px-4 py-3 rounded-[12px] bg-white hover:bg-white/90 text-[16px] leading-[24px] text-[#262627] font-normal transition cursor-pointer"
          >
            Export images
          </button>

          <button
            onClick={() => setIsExportDrawerOpen(true)}
            className="px-3.5 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 text-[14px] leading-[24px] text-[#7E7E81] hover:text-white transition cursor-pointer"
            title="All export formats (CONTEXT.md, tokens.json, gallery.html)"
          >
            More...
          </button>
        </div>
      </div>

      {/* 3. Filter & View Switcher Row (#30:208) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Filter Button + Active Filter Chips (#30:208) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer ${
                isFilterOpen ? 'bg-[#242628]/60' : ''
              }`}
            >
              <img src="/assets/figma/icon-filter.svg" width={24} height={24} alt="" />
              <span>Filter</span>
            </button>

            {/* Active Viewport Chip (#30:213) */}
            {activeTab !== 'components' && activeTab !== 'tokens' && activeTab !== 'modals' && (
              <>
                {viewportFilter !== 'all' ? (
                  <button
                    onClick={() => setViewportFilter('all')}
                    className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
                    title="Clear viewport filter"
                  >
                    <span>{capitalizeWord(viewportFilter)}</span>
                    <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
                  </button>
                ) : (
                  availableViewports.map((vp) => (
                    <button
                      key={vp}
                      onClick={() => setViewportFilter(vp)}
                      className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
                      title={`Filter by ${capitalizeWord(vp)}`}
                    >
                      <span>{capitalizeWord(vp)}</span>
                      <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="" />
                    </button>
                  ))
                )}

                {/* Active Theme Chip (#30:218) */}
                {themeFilter !== 'all' ? (
                  <button
                    onClick={() => setThemeFilter('all')}
                    className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
                    title="Clear theme filter"
                  >
                    <span>{capitalizeWord(themeFilter)}</span>
                    <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
                  </button>
                ) : (
                  availableThemes.map((th) => (
                    <button
                      key={th}
                      onClick={() => setThemeFilter(th)}
                      className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
                      title={`Filter by ${capitalizeWord(th)}`}
                    >
                      <span>{capitalizeWord(th)}</span>
                      <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="" />
                    </button>
                  ))
                )}
              </>
            )}

            {/* Category Chip when filtered in Sections or Components */}
            {categoryFilter !== 'all' && (
              <button
                onClick={() => setCategoryFilter('all')}
                className="px-4 py-3 rounded-[12px] bg-[#252627] hover:bg-[#2E3032] flex items-center gap-2.5 text-[16px] leading-[24px] text-white transition cursor-pointer"
              >
                <span>{capitalizeWord(categoryFilter)}</span>
                <img src="/assets/figma/icon-chip-remove.svg" width={24} height={24} alt="Remove" />
              </button>
            )}
          </div>

          {/* Right: Clean View Switcher Pills (Screens, Sections, Components, Modals, Tokens) */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'screens', label: 'Screens', count: screens.length },
              { id: 'sections', label: 'Sections', count: sections.length },
              { id: 'components', label: 'Components', count: components.length },
              ...(modals.length > 0 ? [{ id: 'modals', label: 'Modals', count: modals.length }] : []),
              { id: 'tokens', label: 'Tokens', count: tokens.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setCategoryFilter('all');
                    if (tab.id === 'tokens' || tab.id === 'modals') {
                      setIsFilterOpen(false);
                    }
                  }}
                  className={`px-4 py-3 rounded-[12px] text-[16px] leading-[24px] flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? 'bg-[#252627] text-white font-medium'
                      : 'border border-[#242628] text-[#7E7E81] hover:text-white hover:bg-[#242628]/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[14px] text-[#7E7E81]">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Filter Panel when "Filter" button is clicked */}
        {isFilterOpen && (
          <div className="p-6 rounded-[24px] bg-[#0C0D0D] border border-[#242628] flex flex-wrap items-center gap-8">
            {activeTab !== 'components' && activeTab !== 'tokens' && activeTab !== 'modals' && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-[#7E7E81]">Viewport</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['all', 'desktop', 'mobile', 'tablet', 'ultrawide'].map((vp) => (
                      <button
                        key={vp}
                        onClick={() => setViewportFilter(vp)}
                        className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                          viewportFilter === vp
                            ? 'bg-white text-[#262627] font-medium'
                            : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                        }`}
                      >
                        {vp === 'all' ? 'All viewports' : capitalizeWord(vp)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-[#7E7E81]">Theme</span>
                  <div className="flex items-center gap-2">
                    {['all', 'light', 'dark'].map((th) => (
                      <button
                        key={th}
                        onClick={() => setThemeFilter(th)}
                        className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                          themeFilter === th
                            ? 'bg-white text-[#262627] font-medium'
                            : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                        }`}
                      >
                        {th === 'all' ? 'All themes' : capitalizeWord(th)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'screens' && (
              <div className="flex flex-col gap-2">
                <span className="text-[14px] text-[#7E7E81]">Capture scope</span>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'full_page', label: 'Full page' },
                    { id: 'fold', label: 'Above fold' },
                    { id: 'all', label: 'All' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setFoldFilter(sc.id)}
                      className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                        foldFilter === sc.id
                          ? 'bg-white text-[#262627] font-medium'
                          : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sections' && sectionCategories.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[14px] text-[#7E7E81]">Section type</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-white text-[#262627] font-medium'
                        : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                    }`}
                  >
                    All sections
                  </button>
                  {sectionCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3.5 py-2 rounded-[12px] text-[14px] capitalize transition cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-white text-[#262627] font-medium'
                          : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'components' && componentCategories.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[14px] text-[#7E7E81]">Component category</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                      categoryFilter === 'all'
                        ? 'bg-white text-[#262627] font-medium'
                        : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                    }`}
                  >
                    All components
                  </button>
                  {componentCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3.5 py-2 rounded-[12px] text-[14px] capitalize transition cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-white text-[#262627] font-medium'
                          : 'bg-[#1D1D1E] text-[#7E7E81] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 3-Column Card Grid (#30:223) */}
      {/* A. SCREENS GRID */}
      {activeTab === 'screens' && (
        filteredScreens.length === 0 ? (
          <div className="bg-[#0C0D0D] rounded-[24px] p-12 text-center text-[16px] leading-[24px] text-[#7E7E81]">
            {isLiveCapturing ? 'Waiting for first screen capture...' : 'No screens match the active filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScreens.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => openScreenLightbox(idx)}
                className="group bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-4 border border-transparent hover:border-[#242628] transition cursor-pointer"
              >
                {/* Thumbnail Preview (#30:225 — EL-cde1ee1c) */}
                <div className="relative bg-[#1D1D1E] rounded-[12px] h-[258px] overflow-hidden flex items-start justify-center">
                  <img
                    src={s.url}
                    alt={s.route_path}
                    className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                {/* Page Title & Metadata (#30:226 — EL-e03b43ef) */}
                <div className="px-3 flex flex-col gap-2">
                  <div className="text-[16px] leading-[24px] text-white font-normal truncate">
                    {formatRouteTitle(s.route_path)}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] leading-[24px] text-[#7E7E81] flex-wrap">
                    <span className="capitalize">{s.viewport_label}</span>
                    <span>{s.width}×{s.height}</span>
                    <span className="capitalize">{s.theme}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* B. SECTIONS GRID */}
      {activeTab === 'sections' && (
        filteredSections.length === 0 ? (
          <div className="bg-[#0C0D0D] rounded-[24px] p-12 text-center text-[16px] leading-[24px] text-[#7E7E81]">
            {isLiveCapturing ? 'Slicing semantic page sections...' : 'No sections match the active filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => openSectionLightbox(idx)}
                className="group bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-4 border border-transparent hover:border-[#242628] transition cursor-pointer"
              >
                <div className="relative bg-[#1D1D1E] rounded-[12px] h-[258px] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={sec.url}
                    alt={sec.section_category}
                    className="max-h-full max-w-full object-contain rounded-[8px] transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                <div className="px-3 flex flex-col gap-2">
                  <div className="text-[16px] leading-[24px] text-white font-normal capitalize truncate">
                    {sec.section_category}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] leading-[24px] text-[#7E7E81] flex-wrap">
                    <span>{sec.route_path}</span>
                    <span>{sec.width}×{sec.height}</span>
                    <span className="capitalize">{sec.theme}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* C. MODALS GRID */}
      {activeTab === 'modals' && (
        modals.length === 0 ? (
          <div className="bg-[#0C0D0D] rounded-[24px] p-12 text-center text-[16px] leading-[24px] text-[#7E7E81]">
            No interactive modals or drawers were triggered on the crawled routes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modals.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => openModalLightbox(idx)}
                className="group bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-4 border border-transparent hover:border-[#242628] transition cursor-pointer"
              >
                <div className="relative bg-[#1D1D1E] rounded-[12px] h-[258px] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={m.url}
                    alt={m.section_category}
                    className="max-h-full max-w-full object-contain rounded-[8px] transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                <div className="px-3 flex flex-col gap-2">
                  <div className="text-[16px] leading-[24px] text-white font-normal truncate">
                    {m.section_category.replace('modal_', 'Modal: ')}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] leading-[24px] text-[#7E7E81]">
                    <span>{m.route_path}</span>
                    <span>Interactive state</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* D. UI COMPONENTS GRID */}
      {activeTab === 'components' && (
        filteredComponents.length === 0 ? (
          <div className="bg-[#0C0D0D] rounded-[24px] p-12 text-center text-[16px] leading-[24px] text-[#7E7E81]">
            {isLiveCapturing ? 'Harvesting UI components...' : 'No components match the active filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((c, idx) => (
              <div
                key={c.id}
                onClick={() => setComponentIndex(idx)}
                className="group bg-[#0C0D0D] rounded-[24px] p-6 flex flex-col gap-4 border border-transparent hover:border-[#242628] transition cursor-pointer"
              >
                <div className="relative bg-[#1D1D1E] rounded-[12px] h-[258px] overflow-hidden flex items-center justify-center p-6">
                  <img
                    src={c.url}
                    alt={c.category}
                    className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="px-3 flex flex-col gap-2">
                  <div className="text-[16px] leading-[24px] text-white font-normal capitalize truncate">
                    {c.category}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] leading-[24px] text-[#7E7E81] flex-wrap">
                    <span>Used {c.instances_count}x</span>
                    <span className="font-mono text-[14px]">fp:{c.fingerprint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* E. DESIGN TOKENS VIEW */}
      {activeTab === 'tokens' && (
        <TokenInspector tokens={tokens} />
      )}

      {/* Interactive Lightbox Modal */}
      {currentLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0C0D0D] border border-[#242628] rounded-[24px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            {/* Lightbox Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#242628] bg-[#131415]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 rounded-[8px] bg-[#252627] text-[#7E7E81] font-mono text-[12px]">
                  {lightboxIndex! + 1} / {lightboxItems.length}
                </span>
                <span className="text-[16px] leading-[24px] text-white font-medium truncate">
                  {currentLightboxItem.title}
                </span>
                {currentLightboxItem.subtitle && (
                  <span className="text-[14px] text-[#7E7E81] hidden sm:inline">
                    {currentLightboxItem.subtitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-[12px] bg-[#1D1D1E] border border-[#242628] p-1 text-white">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-[#242628] rounded-[8px] text-[#7E7E81] hover:text-white transition"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={() => { setZoomLevel(1.0); setIsFitMode(true); }}
                    className="px-2.5 py-0.5 text-[12px] font-mono text-white"
                    title="Reset Zoom (0)"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(4.0, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-[#242628] rounded-[8px] text-[#7E7E81] hover:text-white transition"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>

                <button
                  onClick={() => setIsFitMode(!isFitMode)}
                  className={`p-2.5 rounded-[12px] border text-xs transition ${
                    isFitMode
                      ? 'bg-[#1D1D1E] border-[#242628] text-[#7E7E81] hover:text-white'
                      : 'bg-white border-white text-[#262627]'
                  }`}
                  title={isFitMode ? 'Actual size' : 'Fit to window'}
                >
                  {isFitMode ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </button>

                {onRecapture && currentLightboxItem.route_path && (
                  <button
                    onClick={() => {
                      onRecapture([currentLightboxItem.route_path!]);
                      setLightboxIndex(null);
                    }}
                    className="px-3.5 py-2 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-white text-[14px] flex items-center gap-2 transition"
                    title="Recapture this route"
                  >
                    <img src="/assets/figma/icon-refresh.svg" width={18} height={18} alt="" />
                    <span className="hidden sm:inline">Recapture</span>
                  </button>
                )}

                <a
                  href={currentLightboxItem.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-[#7E7E81] hover:text-white transition"
                  title="Download PNG"
                >
                  <Download size={15} />
                </a>

                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2.5 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-[#7E7E81] hover:text-white transition"
                  title="Close (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Lightbox Canvas */}
            <div className="relative flex-1 overflow-auto bg-[#0C0D0D] p-6 flex items-center justify-center min-h-[55vh]">
              {lightboxItems.length > 1 && (
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + lightboxItems.length) % lightboxItems.length : 0));
                    setZoomLevel(1.0);
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#1D1D1E] hover:bg-[#242628] text-white border border-[#242628] shadow-2xl transition z-20 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {lightboxItems.length > 1 && (
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % lightboxItems.length : 0));
                    setZoomLevel(1.0);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#1D1D1E] hover:bg-[#242628] text-white border border-[#242628] shadow-2xl transition z-20 cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              <div
                className={`transition-transform duration-150 ${
                  isFitMode ? 'flex items-center justify-center' : 'w-full flex justify-center'
                }`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: isFitMode ? 'center center' : 'top center',
                }}
              >
                <img
                  src={currentLightboxItem.url}
                  alt={currentLightboxItem.title}
                  onClick={() => {
                    if (zoomLevel === 1.0 && isFitMode) {
                      setZoomLevel(1.5);
                      setIsFitMode(false);
                    } else {
                      setZoomLevel(1.0);
                      setIsFitMode(true);
                    }
                  }}
                  className={`rounded-[12px] shadow-2xl transition duration-150 cursor-pointer ${
                    zoomLevel > 1.0 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  } ${
                    isFitMode ? 'max-h-[75vh] max-w-full object-contain' : 'w-full max-w-5xl h-auto'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Inspector Modal */}
      {currentComponent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setComponentIndex(null)}
        >
          <div
            className="w-full max-w-[600px] bg-[#0C0D0D] border border-[#242628] rounded-[24px] p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[22px] leading-[28px] font-bold text-white capitalize">
                  {currentComponent.category}
                </h3>
                <span className="px-2.5 py-1 rounded-[8px] bg-[#252627] text-[#7E7E81] font-mono text-[12px]">
                  {componentIndex! + 1} / {filteredComponents.length}
                </span>
              </div>
              <button
                onClick={() => setComponentIndex(null)}
                className="p-2 text-[#7E7E81] hover:text-white rounded-[12px] hover:bg-[#242628] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-6 pr-1">
              <div className="p-8 rounded-[12px] bg-[#1D1D1E] flex items-center justify-center">
                <img src={currentComponent.url} alt="Component" className="max-h-44 object-contain" />
              </div>

              <div className="flex items-center justify-between text-[15px] text-[#7E7E81] px-1">
                <span>Detected instances across site</span>
                <span className="text-white font-mono">{currentComponent.instances_count}x</span>
              </div>

              {currentComponent.computed_styles && (
                <div className="flex flex-col gap-3">
                  <span className="text-[14px] text-[#7E7E81]">Computed CSS properties</span>
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-[13px]">
                    {Object.entries(currentComponent.computed_styles).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-[12px] bg-[#131415] border border-[#242628]">
                        <span className="text-[#7E7E81] block text-[11px]">{key}</span>
                        <span className="text-white truncate block mt-0.5">{val || 'none'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentComponent.routes && (
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] text-[#7E7E81]">Appears on routes</span>
                  <div className="flex flex-wrap gap-2 font-mono text-[13px]">
                    {currentComponent.routes.map((r) => (
                      <span key={r} className="px-3 py-1.5 rounded-[10px] bg-[#252627] text-white">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#242628] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setComponentIndex((prev) => (prev !== null ? (prev - 1 + filteredComponents.length) % filteredComponents.length : 0))}
                  className="px-4 py-2 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-white text-[14px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setComponentIndex((prev) => (prev !== null ? (prev + 1) % filteredComponents.length : 0))}
                  className="px-4 py-2 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-white text-[14px]"
                >
                  Next
                </button>
              </div>
              <button
                onClick={() => setComponentIndex(null)}
                className="px-5 py-2 bg-white hover:bg-white/90 text-[#262627] font-medium rounded-[12px] text-[14px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recapture Routes Modal */}
      {isRecaptureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsRecaptureModalOpen(false)}
        >
          <div
            className="w-full max-w-[520px] bg-[#0C0D0D] border border-[#242628] rounded-[24px] p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-[22px] leading-[28px] font-bold text-white">Recapture routes</h3>
                <p className="text-[14px] text-[#7E7E81]">Select pages to re-crawl and update in place.</p>
              </div>
              <button
                onClick={() => setIsRecaptureModalOpen(false)}
                className="p-2 text-[#7E7E81] hover:text-white rounded-[12px] hover:bg-[#242628] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto">
              <div className="flex items-center justify-between text-[13px] text-[#7E7E81]">
                <span>{Object.values(selectedRecaptureRoutes).filter(Boolean).length} selected</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      allUniqueRoutes.forEach((r) => { all[r] = true; });
                      setSelectedRecaptureRoutes(all);
                    }}
                    className="text-white hover:underline cursor-pointer"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedRecaptureRoutes({})}
                    className="text-[#7E7E81] hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto bg-[#131415] p-2.5 rounded-[16px] border border-[#242628]">
                {allUniqueRoutes.map((route) => {
                  const isChecked = !!selectedRecaptureRoutes[route];
                  return (
                    <button
                      key={route}
                      onClick={() => {
                        setSelectedRecaptureRoutes((prev) => ({
                          ...prev,
                          [route]: !prev[route],
                        }));
                      }}
                      className="flex items-center justify-between p-3 hover:bg-[#1D1D1E] rounded-[12px] text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 font-mono text-[14px] text-white">
                        <div
                          className={`w-5 h-5 rounded-[6px] flex items-center justify-center ${
                            isChecked ? 'bg-white text-[#262627]' : 'border border-[#7E7E81]'
                          }`}
                        >
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span>{route}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRecaptureModalOpen(false)}
                className="px-4 py-2.5 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-white text-[14px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRecapture}
                disabled={Object.values(selectedRecaptureRoutes).filter(Boolean).length === 0}
                className="px-5 py-2.5 rounded-[12px] bg-white hover:bg-white/90 disabled:opacity-40 text-[#262627] text-[14px] font-medium cursor-pointer"
              >
                Recapture selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Drawer Modal */}
      <ExportDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
        runId={runId}
      />
    </div>
  );
};
