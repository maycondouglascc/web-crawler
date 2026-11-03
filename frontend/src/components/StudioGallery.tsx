import React, { useState } from 'react';
import {
  Monitor, Smartphone, Moon, Sun, Layers, LayoutGrid, Box,
  Eye, Download, Code, Sparkles, Filter, ExternalLink, X
} from 'lucide-react';

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

interface StudioGalleryProps {
  screens: ScreenItem[];
  sections: SectionItem[];
  components: ComponentItem[];
  onReset?: () => void;
}

export const StudioGallery: React.FC<StudioGalleryProps> = ({
  screens,
  sections,
  components,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'screens' | 'sections' | 'components'>('screens');
  const [viewportFilter, setViewportFilter] = useState<string>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [foldFilter, setFoldFilter] = useState<string>('all');

  // Modal inspection
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);

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

  // Unique categories for filters
  const sectionCategories = Array.from(new Set(sections.map((s) => s.section_category).filter(Boolean)));
  const componentCategories = Array.from(new Set(components.map((c) => c.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid size={20} className="text-emerald-400" />
            Visual Intelligence Gallery
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore pixel-perfect screens, semantic sections, and harvested UI components.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => { setActiveTab('screens'); setCategoryFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'screens'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor size={14} />
            <span>Full Screens</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{screens.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('sections'); setCategoryFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'sections'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Sections</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{sections.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('components'); setCategoryFilter('all'); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'components'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={14} />
            <span>UI Components</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{components.length}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-500 mr-1" />

          {activeTab !== 'components' && (
            <>
              {/* Viewport Filter */}
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

              {/* Theme Filter */}
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
              <option value="all">Full & Above-Fold</option>
              <option value="full_page">Full Page Only</option>
              <option value="fold">Above the Fold Only</option>
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

      {/* Grid: Screens View */}
      {activeTab === 'screens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScreens.map((s) => (
            <div
              key={s.id}
              className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg hover:shadow-2xl"
            >
              {/* Image Preview Container */}
              <div
                className="relative bg-slate-950/80 overflow-hidden cursor-pointer aspect-video flex items-start justify-center border-b border-slate-800/80"
                onClick={() => setSelectedImage(s.url)}
              >
                <img
                  src={s.url}
                  alt={s.route_path}
                  className="w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 backdrop-blur-sm">
                    <Eye size={14} />
                    View Fullscreen
                  </span>
                </div>
              </div>

              {/* Card Meta */}
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

                <div className="flex items-center gap-1.5">
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
      )}

      {/* Grid: Sections View */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg"
            >
              <div
                className="relative bg-slate-950/80 overflow-hidden cursor-pointer aspect-[16/10] flex items-center justify-center border-b border-slate-800/80 p-2"
                onClick={() => setSelectedImage(sec.url)}
              >
                <img
                  src={sec.url}
                  alt={sec.section_category}
                  className="max-h-full max-w-full object-contain rounded transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
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
                  onClick={() => setSelectedImage(sec.url)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Zoom"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid: UI Components View */}
      {activeTab === 'components' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredComponents.map((c) => (
            <div
              key={c.id}
              className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col transition shadow-lg"
            >
              {/* Component Crop */}
              <div
                className="relative bg-[#0d1322] overflow-hidden cursor-pointer h-40 flex items-center justify-center border-b border-slate-800/80 p-4"
                onClick={() => setSelectedComponent(c)}
              >
                <img
                  src={c.url}
                  alt={c.category}
                  className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Meta */}
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
                    onClick={() => setSelectedComponent(c)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
                  >
                    <Code size={13} />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 transition z-10 border border-slate-700"
            >
              <X size={18} />
            </button>
            <img src={selectedImage} alt="Expanded preview" className="w-auto h-auto max-h-[85vh] rounded-lg mx-auto" />
          </div>
        </div>
      )}

      {/* Component Inspector Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Box size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-sm capitalize">
                  {selectedComponent.category} Component Inspector
                </h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px]">
                  {selectedComponent.instances_count} instances
                </span>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Preview Box */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center">
                <img src={selectedComponent.url} alt="Component" className="max-h-36 object-contain" />
              </div>

              {/* Computed CSS Tokens */}
              {selectedComponent.computed_styles && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Extracted Computed Styles
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(selectedComponent.computed_styles).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">{key}</span>
                        <span className="text-slate-200 truncate block">{val || 'none'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Where Used */}
              {selectedComponent.routes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Routes Appearing In
                  </h4>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {selectedComponent.routes.map((r) => (
                      <span key={r} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setSelectedComponent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
