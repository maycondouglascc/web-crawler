import React, { useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Square,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TokenInspector } from "./TokenInspector";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import { FigmaIcon } from "./ui/icons";
import { MediaCard } from "./ui/MediaCard";
import { Modal } from "./ui/Modal";

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
  type: "screen" | "section" | "modal";
}

type GalleryTab = "screens" | "sections" | "modals" | "components" | "tokens";

interface StudioGalleryProps {
  runId: string;
  screens: ScreenItem[];
  sections: SectionItem[];
  modals?: ModalItem[];
  components: ComponentItem[];
  tokens?: Array<{ id: string; category: "color" | "typography" | "radius" | "shadow"; name: string; value: string; usage_count: number }>;
  onReset?: () => void;
  onRecapture?: (routePaths: string[]) => void;
  isLiveCapturing?: boolean;
  recaptureRequestId?: number;
}

function tabLabel(tab: GalleryTab): string {
  switch (tab) {
    case "screens":
      return "Screens";
    case "sections":
      return "Sections";
    case "modals":
      return "Modals";
    case "components":
      return "Components";
    case "tokens":
      return "Tokens";
    default: {
      const unreachable: never = tab;
      return unreachable;
    }
  }
}

export const StudioGallery: React.FC<StudioGalleryProps> = ({
  screens,
  sections,
  modals = [],
  components,
  tokens = [],
  onRecapture,
  isLiveCapturing = false,
  recaptureRequestId = 0,
}) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>("screens");
  const [viewportFilter, setViewportFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [foldFilter, setFoldFilter] = useState<string>("full_page");
  const [filterOpen, setFilterOpen] = useState(false);

  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFitMode, setIsFitMode] = useState(true);

  const [componentIndex, setComponentIndex] = useState<number | null>(null);
  const [isRecaptureModalOpen, setIsRecaptureModalOpen] = useState(false);
  const [selectedRecaptureRoutes, setSelectedRecaptureRoutes] = useState<Record<string, boolean>>({});

  const filteredScreens = screens.filter((screen) => {
    if (viewportFilter !== "all" && screen.viewport_label !== viewportFilter) return false;
    if (themeFilter !== "all" && screen.theme !== themeFilter) return false;
    if (foldFilter !== "all" && screen.capture_type !== foldFilter) return false;
    return true;
  });

  const filteredSections = sections.filter((section) => {
    if (viewportFilter !== "all" && section.viewport_label !== viewportFilter) return false;
    if (themeFilter !== "all" && section.theme !== themeFilter) return false;
    if (categoryFilter !== "all" && section.section_category !== categoryFilter) return false;
    return true;
  });

  const filteredComponents = components.filter((component) => {
    if (categoryFilter !== "all" && component.category !== categoryFilter) return false;
    return true;
  });

  const sectionCategories = Array.from(new Set(sections.map((section) => section.section_category).filter(Boolean)));
  const componentCategories = Array.from(new Set(components.map((component) => component.category).filter(Boolean)));
  const allUniqueRoutes = Array.from(new Set(screens.map((screen) => screen.route_path))).sort();

  useEffect(() => {
    if (!filterOpen) return;
    const close = () => setFilterOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [filterOpen]);

  const seenRecaptureRequest = useRef(recaptureRequestId);
  useEffect(() => {
    if (seenRecaptureRequest.current === recaptureRequestId) return;
    seenRecaptureRequest.current = recaptureRequestId;
    if (recaptureRequestId <= 0) return;
    const initial: Record<string, boolean> = {};
    allUniqueRoutes.forEach((route) => {
      initial[route] = true;
    });
    setSelectedRecaptureRoutes(initial);
    setIsRecaptureModalOpen(true);
  }, [recaptureRequestId, allUniqueRoutes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex !== null && lightboxItems.length > 0) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setLightboxIndex((prev) => (prev !== null ? (prev - 1 + lightboxItems.length) % lightboxItems.length : 0));
          setZoomLevel(1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setLightboxIndex((prev) => (prev !== null ? (prev + 1) % lightboxItems.length : 0));
          setZoomLevel(1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          setLightboxIndex(null);
        } else if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          setZoomLevel((zoom) => Math.min(4, +(zoom + 0.25).toFixed(2)));
        } else if (event.key === "-" || event.key === "_") {
          event.preventDefault();
          setZoomLevel((zoom) => Math.max(0.5, +(zoom - 0.25).toFixed(2)));
        } else if (event.key === "0") {
          event.preventDefault();
          setZoomLevel(1);
          setIsFitMode(true);
        }
      }

      if (componentIndex !== null && filteredComponents.length > 0) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setComponentIndex((prev) => (prev !== null ? (prev - 1 + filteredComponents.length) % filteredComponents.length : 0));
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setComponentIndex((prev) => (prev !== null ? (prev + 1) % filteredComponents.length : 0));
        } else if (event.key === "Escape") {
          event.preventDefault();
          setComponentIndex(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxItems, componentIndex, filteredComponents]);

  const openScreenLightbox = (index: number) => {
    setLightboxItems(
      filteredScreens.map((screen) => ({
        id: screen.id,
        url: screen.url,
        title: screen.route_path,
        subtitle: `${capitalize(screen.viewport_label)} ${screen.width}×${screen.height} ${capitalize(screen.theme)}`,
        route_path: screen.route_path,
        type: "screen",
      })),
    );
    setLightboxIndex(index);
    setZoomLevel(1);
    setIsFitMode(true);
  };

  const openSectionLightbox = (index: number) => {
    setLightboxItems(
      filteredSections.map((section) => ({
        id: section.id,
        url: section.url,
        title: section.section_category,
        subtitle: `${section.route_path} ${capitalize(section.viewport_label)} ${capitalize(section.theme)}`,
        route_path: section.route_path,
        type: "section",
      })),
    );
    setLightboxIndex(index);
    setZoomLevel(1);
    setIsFitMode(true);
  };

  const openModalLightbox = (index: number) => {
    setLightboxItems(
      modals.map((item) => ({
        id: item.id,
        url: item.url,
        title: item.section_category.replace("modal_", ""),
        subtitle: item.route_path,
        route_path: item.route_path,
        type: "modal",
      })),
    );
    setLightboxIndex(index);
    setZoomLevel(1);
    setIsFitMode(true);
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey || isFitMode) {
      if (event.deltaY < 0) {
        setZoomLevel((zoom) => Math.min(4, +(zoom + 0.15).toFixed(2)));
      } else {
        setZoomLevel((zoom) => Math.max(0.5, +(zoom - 0.15).toFixed(2)));
      }
    }
  };

  const currentLightboxItem = lightboxIndex !== null ? lightboxItems[lightboxIndex] : null;
  const currentComponent = componentIndex !== null ? filteredComponents[componentIndex] : null;

  const executeRecapture = () => {
    if (!onRecapture) return;
    const paths = Object.entries(selectedRecaptureRoutes)
      .filter(([, selected]) => selected)
      .map(([path]) => path);
    if (paths.length > 0) {
      setIsRecaptureModalOpen(false);
      onRecapture(paths);
    }
  };

  const emptyCopy = isLiveCapturing ? "Waiting for the first capture" : "Nothing matches these filters";

  const contentTabs: Array<{ id: GalleryTab; label: string; count: number }> = [
    { id: "screens", label: "Screens", count: screens.length },
    { id: "sections", label: "Sections", count: sections.length },
    { id: "components", label: "Components", count: components.length },
    ...(modals.length > 0 ? [{ id: "modals" as GalleryTab, label: "Modals", count: modals.length }] : []),
    { id: "tokens", label: "Tokens", count: tokens.length },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Filter & Content Bar — Left: Figma Filter Popover + Active Chips | Right: Guided Content Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Chip
              kind="outline"
              label="Filter"
              icon={<FigmaIcon name="filter" />}
              onClick={() => setFilterOpen((open) => !open)}
            />
            {filterOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 flex w-[280px] flex-col gap-4 rounded-card border border-line bg-overlay-surface p-6 shadow-2xl">
                <FilterGroup label="Content">
                  {(["screens", "sections", "modals", "components", "tokens"] as GalleryTab[]).map((tab) => (
                    <FilterOption
                      key={tab}
                      label={tabLabel(tab)}
                      selected={activeTab === tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setCategoryFilter("all");
                      }}
                    />
                  ))}
                </FilterGroup>
                {activeTab !== "components" && activeTab !== "tokens" && activeTab !== "modals" && (
                  <>
                    <FilterGroup label="Viewport">
                      {[
                        ["all", "Any viewport"],
                        ["desktop", "Desktop"],
                        ["mobile", "Mobile"],
                        ["tablet", "Tablet"],
                        ["ultrawide", "Ultrawide"],
                      ].map(([value, label]) => (
                        <FilterOption
                          key={value}
                          label={label}
                          selected={viewportFilter === value}
                          onClick={() => setViewportFilter(value)}
                        />
                      ))}
                    </FilterGroup>
                    <FilterGroup label="Theme">
                      {[
                        ["all", "Any theme"],
                        ["light", "Light"],
                        ["dark", "Dark"],
                      ].map(([value, label]) => (
                        <FilterOption key={value} label={label} selected={themeFilter === value} onClick={() => setThemeFilter(value)} />
                      ))}
                    </FilterGroup>
                  </>
                )}
                {activeTab === "screens" && (
                  <FilterGroup label="Capture">
                    {[
                      ["full_page", "Full page"],
                      ["fold", "Above the fold"],
                      ["all", "Full and fold"],
                    ].map(([value, label]) => (
                      <FilterOption key={value} label={label} selected={foldFilter === value} onClick={() => setFoldFilter(value)} />
                    ))}
                  </FilterGroup>
                )}
                {activeTab === "sections" && sectionCategories.length > 0 && (
                  <FilterGroup label="Section">
                    <FilterOption label="Any section" selected={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
                    {sectionCategories.map((category) => (
                      <FilterOption
                        key={category}
                        label={category}
                        selected={categoryFilter === category}
                        onClick={() => setCategoryFilter(category)}
                      />
                    ))}
                  </FilterGroup>
                )}
                {activeTab === "components" && componentCategories.length > 0 && (
                  <FilterGroup label="Component">
                    <FilterOption label="Any component" selected={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
                    {componentCategories.map((category) => (
                      <FilterOption
                        key={category}
                        label={category}
                        selected={categoryFilter === category}
                        onClick={() => setCategoryFilter(category)}
                      />
                    ))}
                  </FilterGroup>
                )}
              </div>
            )}
          </div>

          {viewportFilter !== "all" && (
            <Chip kind="filled" label={capitalize(viewportFilter)} onDismiss={() => setViewportFilter("all")} />
          )}
          {themeFilter !== "all" && <Chip kind="filled" label={capitalize(themeFilter)} onDismiss={() => setThemeFilter("all")} />}
          {activeTab === "screens" && foldFilter !== "full_page" && (
            <Chip
              kind="filled"
              label={foldFilter === "fold" ? "Fold" : "Full and fold"}
              onDismiss={() => setFoldFilter("full_page")}
            />
          )}
          {categoryFilter !== "all" && <Chip kind="filled" label={capitalize(categoryFilter)} onDismiss={() => setCategoryFilter("all")} />}
        </div>

        {/* Guided Content Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {contentTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCategoryFilter("all");
                }}
                className={`inline-flex h-12 items-center gap-2 rounded-control px-4 text-body transition ${
                  isSelected
                    ? "bg-chip text-white"
                    : "border border-line bg-transparent text-muted hover:bg-surface hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-label text-muted">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "screens" &&
        (filteredScreens.length === 0 ? (
          <EmptyState text={emptyCopy} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredScreens.map((screen, index) => (
              <MediaCard
                key={screen.id}
                title={screen.route_path}
                imageUrl={screen.url}
                imageAlt={screen.route_path}
                meta={[capitalize(screen.viewport_label), capitalize(screen.theme), `${screen.width}×${screen.height}`]}
                onClick={() => openScreenLightbox(index)}
              />
            ))}
          </div>
        ))}

      {activeTab === "sections" &&
        (filteredSections.length === 0 ? (
          <EmptyState text={emptyCopy} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSections.map((section, index) => (
              <MediaCard
                key={section.id}
                title={capitalize(section.section_category)}
                imageUrl={section.url}
                imageAlt={section.section_category}
                fit="contain"
                meta={[section.route_path, capitalize(section.viewport_label), capitalize(section.theme)]}
                onClick={() => openSectionLightbox(index)}
              />
            ))}
          </div>
        ))}

      {activeTab === "modals" &&
        (modals.length === 0 ? (
          <EmptyState text={isLiveCapturing ? "Looking for modals and drawers" : "No modals were captured"} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {modals.map((item, index) => (
              <MediaCard
                key={item.id}
                title={item.section_category.replace("modal_", "")}
                imageUrl={item.url}
                imageAlt={item.section_category}
                fit="contain"
                meta={[item.route_path]}
                onClick={() => openModalLightbox(index)}
              />
            ))}
          </div>
        ))}

      {activeTab === "components" &&
        (filteredComponents.length === 0 ? (
          <EmptyState text={emptyCopy} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredComponents.map((component, index) => (
              <MediaCard
                key={component.id}
                title={capitalize(component.category)}
                imageUrl={component.url}
                imageAlt={component.category}
                fit="contain"
                meta={[`Used ${component.instances_count}x`, component.routes?.[0] || "Sitewide"]}
                onClick={() => setComponentIndex(index)}
              />
            ))}
          </div>
        ))}

      {activeTab === "tokens" && <TokenInspector tokens={tokens} />}

      {currentLightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4" onClick={() => setLightboxIndex(null)}>
          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-card border border-line bg-canvas"
            onClick={(event) => event.stopPropagation()}
            onWheel={handleWheel}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-body text-white">{currentLightboxItem.title}</p>
                <p className="text-label text-muted">
                  {(lightboxIndex ?? 0) + 1} of {lightboxItems.length}
                  {currentLightboxItem.subtitle ? `  ${currentLightboxItem.subtitle}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoomLevel((zoom) => Math.max(0.5, +(zoom - 0.25).toFixed(2)))}
                  className="text-white"
                >
                  <ZoomOut size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setIsFitMode(true);
                  }}
                  className="text-body text-white"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoomLevel((zoom) => Math.min(4, +(zoom + 0.25).toFixed(2)))}
                  className="text-white"
                >
                  <ZoomIn size={24} />
                </button>
                <button
                  type="button"
                  aria-label={isFitMode ? "Actual size" : "Fit"}
                  onClick={() => setIsFitMode(!isFitMode)}
                  className="text-white"
                >
                  {isFitMode ? <Maximize2 size={24} /> : <Minimize2 size={24} />}
                </button>
                {onRecapture && currentLightboxItem.route_path && (
                  <button
                    type="button"
                    aria-label="Recapture route"
                    onClick={() => {
                      onRecapture([currentLightboxItem.route_path!]);
                      setLightboxIndex(null);
                    }}
                    className="text-white"
                    title="Recapture this route"
                  >
                    <FigmaIcon name="refresh" />
                  </button>
                )}
                <a href={currentLightboxItem.url} download className="text-white" aria-label="Download image">
                  <Download size={24} />
                </a>
                <button type="button" aria-label="Close" onClick={() => setLightboxIndex(null)} className="text-white">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="relative flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-sunken p-6">
              {lightboxItems.length > 1 && (
                <button
                  type="button"
                  aria-label="Previous"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + lightboxItems.length) % lightboxItems.length : 0));
                    setZoomLevel(1);
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <img
                src={currentLightboxItem.url}
                alt={currentLightboxItem.title}
                onClick={() => {
                  if (zoomLevel === 1 && isFitMode) {
                    setZoomLevel(1.5);
                    setIsFitMode(false);
                  } else {
                    setZoomLevel(1);
                    setIsFitMode(true);
                  }
                }}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: isFitMode ? "center center" : "top center" }}
                className={`${zoomLevel > 1 ? "cursor-zoom-out" : "cursor-zoom-in"} ${
                  isFitMode ? "max-h-[70vh] max-w-full object-contain" : "w-full max-w-5xl"
                }`}
              />
              {lightboxItems.length > 1 && (
                <button
                  type="button"
                  aria-label="Next"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % lightboxItems.length : 0));
                    setZoomLevel(1);
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <p className="border-t border-line px-6 py-3 text-caption text-subtle">
              Arrow keys move. Plus and minus zoom. Click image to toggle zoom. Escape closes.
            </p>
          </div>
        </div>
      )}

      {currentComponent && (
        <Modal
          title={capitalize(currentComponent.category)}
          description={`Used ${currentComponent.instances_count} times across crawled routes`}
          onClose={() => setComponentIndex(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() =>
                  setComponentIndex((prev) => (prev !== null ? (prev - 1 + filteredComponents.length) % filteredComponents.length : 0))
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setComponentIndex((prev) => (prev !== null ? (prev + 1) % filteredComponents.length : 0))}
              >
                Next
              </Button>
              <Button onClick={() => setComponentIndex(null)}>Done</Button>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center rounded-control bg-sunken p-6">
              <img src={currentComponent.url} alt={currentComponent.category} className="max-h-40 object-contain" />
            </div>
            {currentComponent.computed_styles && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(currentComponent.computed_styles).map(([key, value]) => (
                  <div key={key} className="rounded-control bg-sunken px-4 py-3">
                    <p className="text-label text-muted">{key}</p>
                    <p className="truncate font-mono text-body text-white">{value || "none"}</p>
                  </div>
                ))}
              </div>
            )}
            {currentComponent.routes && currentComponent.routes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentComponent.routes.map((route) => (
                  <span key={route} className="rounded-control bg-sunken px-3 py-1.5 text-label text-muted">
                    {route}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {isRecaptureModalOpen && (
        <Modal
          title="Recapture pages"
          description="Choose which routes to capture again."
          width="md"
          onClose={() => setIsRecaptureModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsRecaptureModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeRecapture} disabled={Object.values(selectedRecaptureRoutes).filter(Boolean).length === 0}>
                Start recapture
              </Button>
            </>
          }
        >
          <div className="mb-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const all: Record<string, boolean> = {};
                allUniqueRoutes.forEach((route) => {
                  all[route] = true;
                });
                setSelectedRecaptureRoutes(all);
              }}
            >
              Select all
            </Button>
            <Button variant="secondary" onClick={() => setSelectedRecaptureRoutes({})}>
              Clear
            </Button>
          </div>
          <div className="flex flex-col">
            {allUniqueRoutes.map((route) => {
              const checked = !!selectedRecaptureRoutes[route];
              return (
                <button
                  key={route}
                  type="button"
                  className="flex items-center gap-4 py-3 text-left text-body text-white"
                  onClick={() => setSelectedRecaptureRoutes((prev) => ({ ...prev, [route]: !prev[route] }))}
                >
                  {checked ? <CheckSquare size={24} /> : <Square size={24} className="text-muted" />}
                  <span>{route}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-card bg-sunken p-6 text-body text-muted">{text}</p>;
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-muted">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function FilterOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`py-1 text-left text-body ${selected ? "text-white" : "text-muted hover:text-white"}`}>
      {label}
    </button>
  );
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
