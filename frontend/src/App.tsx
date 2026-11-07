import React, { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthVaultModal } from "./components/AuthVaultModal";
import { DesignDocs, readDocsStory } from "./components/docs/DesignDocs";
import { DiscoveryReview } from "./components/DiscoveryReview";
import { ExportDrawer } from "./components/ExportDrawer";
import { LiveCrawlProgress } from "./components/LiveCrawlProgress";
import { StudioGallery } from "./components/StudioGallery";
import { Button } from "./components/ui/Button";
import { Chip } from "./components/ui/Chip";
import { FigmaIcon } from "./components/ui/icons";
import { IconButton } from "./components/ui/IconButton";
import { MediaCard } from "./components/ui/MediaCard";
import { SearchField } from "./components/ui/SearchField";
import { TextField } from "./components/ui/TextField";

interface AuthProfile {
  id: string;
  name: string;
  domain: string;
  cookie_count: number;
}

interface LatestRun {
  id: string;
  status: string;
  progress_text: string | null;
  progress_percent: number;
  created_at: string;
  completed_at: string | null;
  screens_count?: number;
  sections_count?: number;
  components_count?: number;
  tokens_count?: number;
  routes_count?: number;
}

interface Project {
  id: string;
  name: string;
  base_url: string;
  auth_profile_id: string | null;
  created_at: string;
  latest_run: LatestRun | null;
  preview_url: string | null;
}

type View = "compose" | "library" | "site";

function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function App() {
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("compose");
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [galleryScreens, setGalleryScreens] = useState<any[]>([]);
  const [gallerySections, setGallerySections] = useState<any[]>([]);
  const [galleryModals, setGalleryModals] = useState<any[]>([]);
  const [galleryComponents, setGalleryComponents] = useState<any[]>([]);
  const [galleryTokens, setGalleryTokens] = useState<any[]>([]);
  const [recaptureRequestId, setRecaptureRequestId] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [docsStory, setDocsStory] = useState<string | null>(() => readDocsStory());

  const wsRef = useRef<WebSocket | null>(null);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/auth/profiles");
      if (res.ok) setProfiles(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return [] as Project[];
      const data: Project[] = await res.json();
      setProjects(data);
      return data;
    } catch (error) {
      console.error(error);
      return [] as Project[];
    }
  };

  useEffect(() => {
    const syncDocs = () => setDocsStory(readDocsStory());
    window.addEventListener("hashchange", syncDocs);
    return () => window.removeEventListener("hashchange", syncDocs);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchProfiles();
      const data = await fetchProjects();
      if (!active) return;
      setView(data.length === 0 ? "compose" : "library");
      setProjectsLoaded(true);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const clearRunView = () => {
    setCurrentRunId(null);
    setRunStatus(null);
    setProgressText("");
    setProgressPercent(0);
    setPatterns([]);
    setGalleryScreens([]);
    setGallerySections([]);
    setGalleryModals([]);
    setGalleryComponents([]);
    setGalleryTokens([]);
  };

  const setupWebSocket = (runId: string) => {
    if (wsRef.current) wsRef.current.close();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/runs/${runId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) setProgressText(data.text);
        if (data.percent !== undefined) setProgressPercent(data.percent);
        if (data.status) {
          setRunStatus(data.status);
          if (data.status === "review_pending") loadDiscoveredRoutes(runId);
          if (data.status === "completed") {
            loadGallery(runId);
            fetchProjects();
          }
        }
        if (data.asset_updated) loadGallery(runId);
      } catch (error) {
        console.error("WS parse error:", error);
      }
    };
    wsRef.current = ws;
  };

  useEffect(() => {
    let interval: number | null = null;
    if (runStatus === "capturing" && currentRunId) {
      loadGallery(currentRunId);
      interval = window.setInterval(() => loadGallery(currentRunId), 2500);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [runStatus, currentRunId]);

  const loadDiscoveredRoutes = async (runId: string) => {
    try {
      const res = await fetch(`/api/runs/${runId}/routes`);
      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error("Failed to load routes:", error);
    }
  };

  const loadGallery = async (runId: string) => {
    try {
      const res = await fetch(`/api/runs/${runId}/gallery`);
      if (res.ok) {
        const data = await res.json();
        setGalleryScreens(data.screens || []);
        setGallerySections(data.sections || []);
        setGalleryModals(data.modals || []);
        setGalleryComponents(data.components || []);
        setGalleryTokens(data.tokens || []);
      }
    } catch (error) {
      console.error("Failed to load gallery:", error);
    }
  };

  const handleStartDiscovery = async () => {
    const normalizedUrl = normalizeUrlInput(targetUrl);
    if (!normalizedUrl) return;
    try {
      clearRunView();
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URL(normalizedUrl).hostname || "Local Project",
          base_url: normalizedUrl,
          auth_profile_id: selectedProfileId || null,
        }),
      });
      if (!projectRes.ok) throw new Error("Failed to create project");
      const project = await projectRes.json();
      const discoverRes = await fetch(`/api/projects/${project.id}/discover`, { method: "POST" });
      if (!discoverRes.ok) throw new Error("Failed to start discovery");
      const discoverData = await discoverRes.json();
      const nextProject: Project = {
        id: project.id,
        name: project.name,
        base_url: project.base_url,
        auth_profile_id: project.auth_profile_id,
        created_at: new Date().toISOString(),
        latest_run: {
          id: discoverData.run_id,
          status: "discovering",
          progress_text: "Initializing crawler browser...",
          progress_percent: 5,
          created_at: new Date().toISOString(),
          completed_at: null,
        },
        preview_url: null,
      };
      setActiveProject(nextProject);
      setView("site");
      setCurrentRunId(discoverData.run_id);
      setRunStatus("discovering");
      setProgressText("Initializing crawler browser...");
      setProgressPercent(5);
      setupWebSocket(discoverData.run_id);
      fetchProjects();
    } catch (error: any) {
      alert(`Error starting discovery: ${error.message}`);
    }
  };

  const handleToggleRoute = async (routeId: string, currentSelected: boolean) => {
    try {
      await fetch("/api/routes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: routeId, is_selected: !currentSelected }),
      });
      if (currentRunId) loadDiscoveredRoutes(currentRunId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTogglePattern = async (pattern: string, selectAll: boolean) => {
    if (!currentRunId) return;
    try {
      await fetch("/api/routes/toggle-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: currentRunId, pattern, is_selected: selectAll }),
      });
      loadDiscoveredRoutes(currentRunId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleProceedToCapture = async (config: any) => {
    if (!currentRunId) return;
    try {
      setRunStatus("capturing");
      setProgressText("Starting capture workers...");
      setProgressPercent(10);
      const res = await fetch(`/api/runs/${currentRunId}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewports: config.viewports,
          themes: config.themes,
          include_fold: config.include_fold ?? false,
        }),
      });
      if (!res.ok) throw new Error("Capture failed to start");
    } catch (error: any) {
      alert(`Failed to launch capture: ${error.message}`);
    }
  };

  const handleRecaptureRoutes = async (routePaths: string[]) => {
    if (!currentRunId || routePaths.length === 0) return;
    try {
      setRunStatus("capturing");
      setProgressText(`Recapturing ${routePaths.length} route(s)...`);
      setProgressPercent(10);
      const res = await fetch(`/api/runs/${currentRunId}/recapture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_paths: routePaths }),
      });
      if (!res.ok) throw new Error("Recapture failed to start");
    } catch (error: any) {
      alert(`Failed to launch recapture: ${error.message}`);
    }
  };

  const openProject = (project: Project) => {
    clearRunView();
    setActiveProject(project);
    setView("site");
    const run = project.latest_run;
    if (!run) return;
    setCurrentRunId(run.id);
    setRunStatus(run.status);
    setProgressText(run.progress_text || "");
    setProgressPercent(run.progress_percent || 0);
    setupWebSocket(run.id);
    if (run.status === "review_pending") loadDiscoveredRoutes(run.id);
    if (run.status === "capturing" || run.status === "completed" || run.status === "failed") loadGallery(run.id);
  };

  const goLibrary = () => {
    if (wsRef.current) wsRef.current.close();
    setActiveProject(null);
    setView(projects.length === 0 ? "compose" : "library");
    fetchProjects();
  };

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);
  const query = search.trim().toLowerCase();
  const visibleProjects = projects.filter((project) => {
    if (!query) return true;
    return project.name.toLowerCase().includes(query) || project.base_url.toLowerCase().includes(query);
  });

  const canExport = runStatus === "completed" && !!currentRunId;
  const canRecapture = !!currentRunId && galleryScreens.length > 0 && (runStatus === "completed" || runStatus === "failed");

  if (docsStory !== null) {
    return <DesignDocs storyId={docsStory} />;
  }

  const siteSummaryParts: string[] = [];
  if (activeProject?.base_url) siteSummaryParts.push(activeProject.base_url);
  if (galleryScreens.length > 0) siteSummaryParts.push(`${galleryScreens.length} screens`);
  if (galleryComponents.length > 0) siteSummaryParts.push(`${galleryComponents.length} components`);
  if (galleryTokens.length > 0) siteSummaryParts.push(`${galleryTokens.length} tokens`);
  const siteSummary = siteSummaryParts.join("  ") || "Summary about the site";

  return (
    <div className="min-h-screen bg-canvas text-white">
      {!projectsLoaded ? (
        <div className="min-h-screen bg-canvas" />
      ) : view === "compose" ? (
        <ComposeScreen
          targetUrl={targetUrl}
          onTargetUrl={setTargetUrl}
          onSubmit={handleStartDiscovery}
          busy={runStatus === "discovering" || runStatus === "capturing"}
          canGoBack={projects.length > 0}
          onBack={goLibrary}
          onOpenVault={() => {
            fetchProfiles();
            setIsAuthModalOpen(true);
          }}
          selectedProfileName={selectedProfile?.name}
          onClearProfile={() => setSelectedProfileId("")}
        />
      ) : view === "library" ? (
        <LibraryScreen
          projects={visibleProjects}
          search={search}
          onSearch={setSearch}
          onOpen={openProject}
          onNewCrawl={() => {
            clearRunView();
            setTargetUrl("");
            setView("compose");
          }}
          onOpenVault={() => {
            fetchProfiles();
            setIsAuthModalOpen(true);
          }}
        />
      ) : (
        <div className="page-frame">
          <button type="button" aria-label="Back to crawls" onClick={goLibrary} className="inline-flex w-fit">
            <FigmaIcon name="back" />
          </button>
          <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4">
              <h1 className="text-display font-bold text-white">{activeProject?.name || "Site"}</h1>
              <p className="text-body text-muted">{siteSummary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <IconButton label="Recapture pages" disabled={!canRecapture} onClick={() => setRecaptureRequestId((id) => id + 1)}>
                <FigmaIcon name="refresh" />
              </IconButton>
              <Button variant="secondary" disabled={!canExport} onClick={() => setIsExportOpen(true)}>
                Export design.md
              </Button>
              <Button
                disabled={!canExport}
                onClick={() => {
                  if (!currentRunId) return;
                  const link = document.createElement("a");
                  link.href = `/api/runs/${currentRunId}/exports/images.zip`;
                  link.download = "images.zip";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
              >
                Export images
              </Button>
            </div>
          </header>

          {(runStatus === "discovering" || runStatus === "capturing" || runStatus === "failed") && (
            <LiveCrawlProgress text={progressText} percent={progressPercent} status={runStatus} />
          )}

          {runStatus === "review_pending" && patterns.length > 0 && (
            <DiscoveryReview
              runId={currentRunId || ""}
              patterns={patterns}
              onToggleRoute={handleToggleRoute}
              onTogglePattern={handleTogglePattern}
              onProceedToCapture={handleProceedToCapture}
            />
          )}

          {(runStatus === "capturing" || runStatus === "completed" || (runStatus === "failed" && galleryScreens.length > 0)) && (
            <StudioGallery
              runId={currentRunId || ""}
              screens={galleryScreens}
              sections={gallerySections}
              modals={galleryModals}
              components={galleryComponents}
              tokens={galleryTokens}
              onRecapture={handleRecaptureRoutes}
              isLiveCapturing={runStatus === "capturing"}
              recaptureRequestId={recaptureRequestId}
            />
          )}
        </div>
      )}

      <AuthVaultModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          fetchProfiles();
        }}
        selectedProfileId={selectedProfileId}
        onProfileSelected={(id) => setSelectedProfileId(id)}
      />
      {currentRunId && <ExportDrawer isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} runId={currentRunId} />}
      <a href="#/docs" className="fixed bottom-6 left-6 z-30 text-caption text-subtle hover:text-white">
        Design system
      </a>
    </div>
  );
}

function ComposeScreen({
  targetUrl,
  onTargetUrl,
  onSubmit,
  busy,
  canGoBack,
  onBack,
  onOpenVault,
  selectedProfileName,
  onClearProfile,
}: {
  targetUrl: string;
  onTargetUrl: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onOpenVault: () => void;
  selectedProfileName?: string;
  onClearProfile: () => void;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-6">
      {canGoBack && (
        <button type="button" aria-label="Back to crawls" onClick={onBack} className="absolute left-6 top-10 inline-flex md:left-20 md:top-20">
          <FigmaIcon name="back" />
        </button>
      )}
      <div className="absolute right-6 top-10 md:right-20 md:top-20">
        <IconButton label="Authenticated sessions" onClick={onOpenVault}>
          <KeyRound size={24} />
        </IconButton>
      </div>
      <form
        className="flex w-full max-w-[800px] flex-col items-center gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <h1 className="text-center text-display font-semibold text-white">Start your first crawl</h1>
        <div className="flex w-full items-center gap-1.5">
          <TextField
            fieldSize="large"
            type="text"
            required
            placeholder="Enter an URL"
            value={targetUrl}
            onChange={(event) => onTargetUrl(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="large" disabled={busy}>
            New crawl
          </Button>
        </div>
        {selectedProfileName && (
          <Chip kind="filled" label={selectedProfileName} onDismiss={onClearProfile} />
        )}
      </form>
    </div>
  );
}

function LibraryScreen({
  projects,
  search,
  onSearch,
  onOpen,
  onNewCrawl,
  onOpenVault,
}: {
  projects: Project[];
  search: string;
  onSearch: (value: string) => void;
  onOpen: (project: Project) => void;
  onNewCrawl: () => void;
  onOpenVault: () => void;
}) {
  return (
    <div className="page-frame">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="text-display font-bold text-white">My crawls</h1>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
          <IconButton label="Authenticated sessions" onClick={onOpenVault}>
            <KeyRound size={24} />
          </IconButton>
          <Button onClick={onNewCrawl}>New crawl</Button>
          <SearchField value={search} onChange={onSearch} />
        </div>
      </header>
      {projects.length === 0 ? (
        <p className="text-body text-muted">No crawls match this search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <MediaCard
              key={project.id}
              title={project.name}
              imageUrl={project.preview_url}
              imageAlt={project.name}
              fallbackText={project.base_url}
              meta={projectMeta(project)}
              onClick={() => onOpen(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function projectMeta(project: Project): string[] {
  const run = project.latest_run;
  const host = hostname(project.base_url);
  if (run && run.status === "completed" && (run.screens_count || 0) > 0) {
    const when = formatMetaDate(run.created_at || project.created_at);
    return [`${run.screens_count} screens`, `${run.components_count || 0} components`, when];
  }
  const status = run ? statusLabel(run.status) : "Not started";
  const when = formatMetaDate(run?.created_at || project.created_at);
  return [host, status, when];
}

function hostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "discovering":
      return "Discovering";
    case "review_pending":
      return "Review";
    case "capturing":
      return "Capturing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "idle":
      return "Idle";
    default:
      return status;
  }
}

function formatMetaDate(iso: string) {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Bahia",
  }).format(date);
}

export default App;
