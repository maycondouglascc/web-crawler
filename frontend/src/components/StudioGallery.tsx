import React, { useState, useEffect } from 'react';
import {
  Monitor, Smartphone, Moon, Sun, Layers, LayoutGrid, Box,
  Eye, Download, Code, Sparkles, Filter, ExternalLink, X,
  Maximize2, Minimize2, Palette, ShieldAlert, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, RefreshCw, CheckSquare, Square
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
  screens: ScreenItem[];
  sections: SectionItem[];
  modals?: ModalItem[];
  components: ComponentItem[];
  tokens?: any[];
  onReset?: () => void;
  onRecapture?: (routePaths: string[]) => void;
  isLiveCapturing?: boolean;
}

export const StudioGallery: React.FC<StudioGalleryProps> = ({
  runId,
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

  // Default to Full Page Only
  const [foldFilter, setFoldFilter] = useState<string>('full_page');

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

  const sectionCategories = Array.from(new Set(sections.map((s) => s.section_category).filter(Boolean)));
  const componentCategories = Array.from(new Set(components.map((c) => c.category).filter(Boolean)));
  const allUniqueRoutes = Array.from(new Set(screens.map((s) => s.route_path))).sort();

  // Keyboard Navigation: Arrow keys, Zoom, and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Lightbox Navigation
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

      // 2. Component Inspector Navigation
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
      title: s.route_path,
      subtitle: `${s.viewport_label} • ${s.width}×${s.height} • ${s.theme} • ${s.capture_type.replace('_', ' ')}`,
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
      title: `${sec.section_category} (${sec.route_path})`,
      subtitle: `${sec.viewport_label} • ${sec.width}×${sec.height} • ${sec.theme}`,
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

  // Wheel zoom handler
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

  // Recapture modal handlers
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

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutGrid size={20} className="text-emerald-400" />
              Visual Intelligence Gallery
            </h2>
            {isLiveCapturing && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live streaming captures...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore screens, sections, interactive modals, UI components, and extracted tokens in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onRecapture && allUniqueRoutes.length > 0 && (
            <button
              onClick={handleOpenRecaptureModal}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Recapture Pages...</span>
            </button>
          )}

          <button
            onClick={() => setIsExportDrawerOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Export Context & Tokens</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 flex-wrap gap-1">
        <button
          onClick={() => { setActiveTab('screens'); setCategoryFilter('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'screens' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor size={14} />
          <span>Full Screens</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{screens.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('sections'); setCategoryFilter('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'sections' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Sections</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{sections.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('modals'); setCategoryFilter('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'modals' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Maximize2 size={14} />
          <span>Modals & Drawers</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{modals.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('components'); setCategoryFilter('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'components' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box size={14} />
          <span>UI Components</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{components.length}</span>
        </button>

        <button
          onClick={() => { setActiveTab('tokens'); setCategoryFilter('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'tokens' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette size={14} />
          <span>Design Tokens</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{tokens.length}</span>
        </button>
      </div>

      {/* Filter Bar */}
      {activeTab !== 'tokens' && activeTab !== 'modals' && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-500 mr-1" />

            {activeTab !== 'components' && (
              <>
                <select
                  value={viewportFilter}
                  onChange={(e) => setViewportFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Viewports</option>
                  <option value="desktop">Desktop (1440px)</option>
                  <option value="mobile">Mobile (375px)</option>
                  <option value="tablet">Tablet (768px)</option>
                  <option value="ultrawide">Ultrawide (1920px)</option>
                </select>

                <select
                  value={themeFilter}
                  onChange={(e) => setThemeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Themes</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </>
            )}

            {activeTab === 'screens' && (
              <select
                value={foldFilter}
                onChange={(e) => setFoldFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="full_page">Full Page Only (Default)</option>
                <option value="fold">Above the Fold Only</option>
                <option value="all">Full & Above-Fold</option>
              </select>
            )}

            {activeTab === 'sections' && sectionCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="all">All Section Types</option>
                {sectionCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {activeTab === 'components' && componentCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="all">All Component Types</option>
                {componentCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="text-slate-500 text-[11px] font-mono">
            Showing{' '}
            {activeTab === 'screens' ? filteredScreens.length : activeTab === 'sections' ? filteredSections.length : filteredComponents.length}{' '}
            items
          </div>
        </div>
      )}

      {/* 1. SCREENS VIEW */}
      {activeTab === 'screens' && (
        filteredScreens.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            {isLiveCapturing ? 'Waiting for first screen capture...' : 'No screens match the selected filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScreens.map((s, idx) => (
              <div
                key={s.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg hover:shadow-2xl"
              >
                <div
                  className="relative bg-slate-950/80 overflow-hidden cursor-pointer aspect-video flex items-start justify-center border-b border-slate-800/80"
                  onClick={() => openScreenLightbox(idx)}
                >
                  <img
                    src={s.url}
                    alt={s.route_path}
                    className="w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 backdrop-blur-sm shadow-lg">
                      <Eye size={14} />
                      Inspect / Zoom
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-semibold text-slate-200">{s.route_path}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{s.viewport_label}</span>
                      <span>•</span>
                      <span>{s.width}×{s.height}</span>
                      <span>•</span>
                      <span className="capitalize">{s.capture_type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onRecapture && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecapture([s.route_path]);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition"
                        title="Recapture this page"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}

                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border ${
                      s.theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {s.theme}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 2. SECTIONS VIEW */}
      {activeTab === 'sections' && (
        filteredSections.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            {isLiveCapturing ? 'Waiting for semantic section slicing...' : 'No sections match the selected filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((sec, idx) => (
              <div
                key={sec.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg"
              >
                <div
                  className="relative bg-slate-950/80 overflow-hidden cursor-pointer aspect-[16/10] flex items-center justify-center border-b border-slate-800/80 p-2"
                  onClick={() => openSectionLightbox(idx)}
                >
                  <img
                    src={sec.url}
                    alt={sec.section_category}
                    className="max-h-full max-w-full object-contain rounded transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 backdrop-blur-sm">
                      <Eye size={14} />
                      Inspect / Zoom
                    </span>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-100 capitalize flex items-center gap-2">
                      <span>{sec.section_category}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                        {sec.width}×{sec.height}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{sec.route_path}</div>
                  </div>

                  <button
                    onClick={() => openSectionLightbox(idx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Zoom"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 3. MODALS & DRAWERS VIEW */}
      {activeTab === 'modals' && (
        modals.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            {isLiveCapturing ? 'Exploring interactive modals & drawers...' : 'No interactive modals or drawers were triggered on the crawled routes.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modals.map((m, idx) => (
              <div
                key={m.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg"
              >
                <div
                  className="relative bg-slate-950/80 overflow-hidden cursor-pointer aspect-video flex items-center justify-center border-b border-slate-800/80 p-4"
                  onClick={() => openModalLightbox(idx)}
                >
                  <img src={m.url} alt="Modal State" className="max-h-full max-w-full object-contain rounded" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 backdrop-blur-sm">
                      <Eye size={14} />
                      Inspect / Zoom
                    </span>
                  </div>
                </div>
                <div className="p-4 text-xs">
                  <div className="font-bold text-slate-100">{m.section_category.replace('modal_', 'Modal: ')}</div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">{m.route_path}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 4. UI COMPONENTS VIEW */}
      {activeTab === 'components' && (
        filteredComponents.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            {isLiveCapturing ? 'Harvesting and deduplicating UI components...' : 'No components match the selected category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredComponents.map((c, idx) => (
              <div
                key={c.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg"
              >
                <div
                  className="relative bg-[#0d1322] overflow-hidden cursor-pointer h-40 flex items-center justify-center border-b border-slate-800/80 p-4"
                  onClick={() => setComponentIndex(idx)}
                >
                  <img src={c.url} alt={c.category} className="max-h-full max-w-full object-contain transition group-hover:scale-105" loading="lazy" />
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider">
                      {c.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] font-medium border border-slate-700">
                      Used {c.instances_count}x
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono text-[10px] text-slate-500 truncate max-w-[130px]">
                      fp:{c.fingerprint}
                    </div>
                    <button
                      onClick={() => setComponentIndex(idx)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Code size={13} />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 5. DESIGN TOKENS VIEW */}
      {activeTab === 'tokens' && (
        <TokenInspector tokens={tokens} />
      )}

      {/* Interactive Lightbox Modal with Zoom & Navigation */}
      {currentLightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            {/* Lightbox Toolbar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                  {lightboxIndex! + 1} of {lightboxItems.length}
                </span>
                <span className="font-mono font-semibold text-slate-100 text-sm truncate max-w-xs md:max-w-md">
                  {currentLightboxItem.title}
                </span>
                {currentLightboxItem.subtitle && (
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    • {currentLightboxItem.subtitle}
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-slate-300">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={() => { setZoomLevel(1.0); setIsFitMode(true); }}
                    className="px-2 py-0.5 text-[11px] font-mono hover:text-white transition"
                    title="Reset Zoom (0)"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(4.0, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>

                {/* Fit vs Actual Size Toggle */}
                <button
                  onClick={() => setIsFitMode(!isFitMode)}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
                    isFitMode
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                  title={isFitMode ? 'Inspect Actual Width (Scrollable)' : 'Fit to Window'}
                >
                  {isFitMode ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </button>

                {/* Quick Recapture */}
                {onRecapture && currentLightboxItem.route_path && (
                  <button
                    onClick={() => {
                      onRecapture([currentLightboxItem.route_path!]);
                      setLightboxIndex(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                    title="Recapture Page"
                  >
                    <RefreshCw size={13} className="text-emerald-400" />
                    <span className="hidden sm:inline">Recapture</span>
                  </button>
                )}

                {/* Download PNG */}
                <a
                  href={currentLightboxItem.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  title="Download PNG"
                >
                  <Download size={15} />
                </a>

                {/* Close Button */}
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  title="Close (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Area with Scroll & Pan */}
            <div className="relative flex-1 overflow-auto bg-[#070A11] p-4 flex items-center justify-center min-h-[50vh]">
              {/* Previous Button */}
              {lightboxItems.length > 1 && (
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + lightboxItems.length) % lightboxItems.length : 0));
                    setZoomLevel(1.0);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition z-20 cursor-pointer"
                  title="Previous (ArrowLeft)"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Next Button */}
              {lightboxItems.length > 1 && (
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % lightboxItems.length : 0));
                    setZoomLevel(1.0);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition z-20 cursor-pointer"
                  title="Next (ArrowRight)"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Rendered Image */}
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
                  className={`rounded-lg shadow-2xl transition duration-150 cursor-pointer ${
                    zoomLevel > 1.0 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  } ${
                    isFitMode ? 'max-h-[78vh] max-w-full object-contain' : 'w-full max-w-5xl h-auto'
                  }`}
                  title={zoomLevel > 1.0 ? 'Click to reset zoom (100%)' : 'Click to zoom in'}
                />
              </div>
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="px-6 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span>← → : Navigate</span>
                <span>•</span>
                <span>+ - : Zoom</span>
                <span>•</span>
                <span>0 : Reset</span>
                <span>•</span>
                <span>Esc : Close</span>
              </div>
              <div>
                Ctrl+Wheel to zoom seamlessly
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Inspector Modal with Navigation */}
      {currentComponent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setComponentIndex(null)}
        >
          <div
            className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Box size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-sm capitalize">
                  {currentComponent.category} Component Inspector
                </h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                  {componentIndex! + 1} of {filteredComponents.length}
                </span>
              </div>
              <button
                onClick={() => setComponentIndex(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-center relative">
                <img src={currentComponent.url} alt="Component" className="max-h-40 object-contain" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Instances across site:</span>
                <span className="font-bold text-white font-mono">{currentComponent.instances_count} times</span>
              </div>

              {currentComponent.computed_styles && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Extracted Computed Styles
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(currentComponent.computed_styles).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">{key}</span>
                        <span className="text-slate-200 truncate block">{val || 'none'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentComponent.routes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Routes Appearing In
                  </h4>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {currentComponent.routes.map((r) => (
                      <span key={r} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                Use ← → keys to browse components
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setComponentIndex((prev) => (prev !== null ? (prev - 1 + filteredComponents.length) % filteredComponents.length : 0))}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => setComponentIndex((prev) => (prev !== null ? (prev + 1) % filteredComponents.length : 0))}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800"
                >
                  Next
                </button>
                <button
                  onClick={() => setComponentIndex(null)}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Page Recapture Modal */}
      {isRecaptureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsRecaptureModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Recapture Specific Pages
                </h3>
              </div>
              <button
                onClick={() => setIsRecaptureModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Select which pages to recapture and re-slice:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      allUniqueRoutes.forEach((r) => { all[r] = true; });
                      setSelectedRecaptureRoutes(all);
                    }}
                    className="text-emerald-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSelectedRecaptureRoutes({})}
                    className="text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                {allUniqueRoutes.map((route) => {
                  const isChecked = !!selectedRecaptureRoutes[route];
                  return (
                    <div
                      key={route}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-900/40 rounded-xl cursor-pointer text-xs"
                      onClick={() => {
                        setSelectedRecaptureRoutes((prev) => ({
                          ...prev,
                          [route]: !prev[route],
                        }));
                      }}
                    >
                      <div className="flex items-center gap-2.5 font-mono text-slate-200">
                        {isChecked ? (
                          <CheckSquare size={16} className="text-emerald-400" />
                        ) : (
                          <Square size={16} className="text-slate-500" />
                        )}
                        <span>{route}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {Object.values(selectedRecaptureRoutes).filter(Boolean).length} route(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecaptureModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteRecapture}
                  disabled={Object.values(selectedRecaptureRoutes).filter(Boolean).length === 0}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <RefreshCw size={13} />
                  <span>Start Recapture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Drawer */}
      <ExportDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
        runId={runId}
      />
    </div>
  );
};
