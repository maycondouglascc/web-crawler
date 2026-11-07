import React, { useState, useEffect, useRef } from 'react';
import { AuthVaultModal } from './components/AuthVaultModal';
import { DiscoveryReview } from './components/DiscoveryReview';
import { LiveCrawlProgress } from './components/LiveCrawlProgress';
import { StudioGallery } from './components/StudioGallery';

interface AuthProfile {
  id: string;
  name: string;
  domain: string;
  cookie_count: number;
}

interface CrawlSummary {
  run_id: string;
  project_id: string;
  site_name: string;
  base_url: string;
  status: string;
  progress_text?: string;
  progress_percent?: number;
  created_at: string;
  screens_count: number;
  sections_count: number;
  components_count: number;
  tokens_count: number;
  routes_count: number;
  preview_url: string | null;
}

export function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Home view mode: 'new_crawl' (Wireframe - 1) or 'my_crawls' (Wireframe - 4)
  const [homeMode, setHomeMode] = useState<'new_crawl' | 'my_crawls'>('new_crawl');
  const [crawls, setCrawls] = useState<CrawlSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedInitialCrawls, setHasLoadedInitialCrawls] = useState(false);

  // Active Run State
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentSiteName, setCurrentSiteName] = useState<string>('');
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>('');
  const [runStatus, setRunStatus] = useState<any>(null);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Discovered Patterns
  const [patterns, setPatterns] = useState<any[]>([]);

  // Gallery Assets
  const [galleryScreens, setGalleryScreens] = useState<any[]>([]);
  const [gallerySections, setGallerySections] = useState<any[]>([]);
  const [galleryModals, setGalleryModals] = useState<any[]>([]);
  const [galleryComponents, setGalleryComponents] = useState<any[]>([]);
  const [galleryTokens, setGalleryTokens] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/auth/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCrawls = async () => {
    try {
      const res = await fetch('/api/crawls');
      if (res.ok) {
        const data: CrawlSummary[] = await res.json();
        setCrawls(data);
        if (!hasLoadedInitialCrawls) {
          setHasLoadedInitialCrawls(true);
          if (data.length > 0) {
            setHomeMode('my_crawls');
          } else {
            setHomeMode('new_crawl');
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchCrawls();
  }, []);

  const normalizeUrlInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
      return `http://${trimmed}`;
    }
    return `https://${trimmed}`;
  };

  const handleStartDiscovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formattedUrl = normalizeUrlInput(targetUrl);
    if (!formattedUrl) return;

    try {
      setGalleryScreens([]);
      setGallerySections([]);
      setGalleryModals([]);
      setGalleryComponents([]);
      setGalleryTokens([]);
      setPatterns([]);

      let hostname = 'Site';
      try {
        hostname = new URL(formattedUrl).hostname || 'Local Project';
      } catch {
        hostname = formattedUrl;
      }

      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hostname,
          base_url: formattedUrl,
          auth_profile_id: selectedProfileId || null,
        }),
      });

      if (!projRes.ok) throw new Error('Failed to create project');
      const project = await projRes.json();

      const discRes = await fetch(`/api/projects/${project.id}/discover`, {
        method: 'POST',
      });

      if (!discRes.ok) throw new Error('Failed to start discovery');
      const discData = await discRes.json();

      setCurrentSiteName(project.name);
      setCurrentBaseUrl(project.base_url);
      setCurrentRunId(discData.run_id);
      setRunStatus('discovering');
      setProgressText('Initializing crawler browser...');
      setProgressPercent(5);

      setupWebSocket(discData.run_id);
    } catch (err: any) {
      alert(`Error starting discovery: ${err.message}`);
    }
  };

  const setupWebSocket = (runId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/runs/${runId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) setProgressText(data.text);
        if (data.percent !== undefined) setProgressPercent(data.percent);
        if (data.status) {
          setRunStatus(data.status);
          if (data.status === 'review_pending') {
            loadDiscoveredRoutes(runId);
          } else if (data.status === 'completed') {
            loadGallery(runId);
            fetchCrawls();
          }
        }
        if (data.asset_updated) {
          loadGallery(runId);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    let interval: any = null;
    if (runStatus === 'capturing' && currentRunId) {
      loadGallery(currentRunId);
      interval = setInterval(() => {
        loadGallery(currentRunId);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runStatus, currentRunId]);

  const loadDiscoveredRoutes = async (runId: string) => {
    try {
      const res = await fetch(`/api/runs/${runId}/routes`);
      if (res.ok) {
        const data = await res.json();
        setPatterns(data.patterns);
      }
    } catch (e) {
      console.error('Failed to load routes:', e);
    }
  };

  const loadGallery = async (runId: string) => {
    try {
      const res = await fetch(`/api/runs/${runId}/gallery`);
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setCurrentSiteName(data.project.site_name || 'Site name');
          setCurrentBaseUrl(data.project.base_url || '');
        }
        setGalleryScreens(data.screens || []);
        setGallerySections(data.sections || []);
        setGalleryModals(data.modals || []);
        setGalleryComponents(data.components || []);
        setGalleryTokens(data.tokens || []);
      }
    } catch (e) {
      console.error('Failed to load gallery:', e);
    }
  };

  const handleOpenExistingCrawl = async (crawl: CrawlSummary) => {
    setCurrentRunId(crawl.run_id);
    setCurrentSiteName(crawl.site_name);
    setCurrentBaseUrl(crawl.base_url);

    if (crawl.status === 'review_pending') {
      setRunStatus('review_pending');
      await loadDiscoveredRoutes(crawl.run_id);
    } else if (crawl.status === 'discovering') {
      setRunStatus('discovering');
      setProgressText(crawl.progress_text || 'Discovering routes...');
      setProgressPercent(crawl.progress_percent || 20);
      setupWebSocket(crawl.run_id);
    } else if (crawl.status === 'capturing') {
      setRunStatus('capturing');
      setProgressText(crawl.progress_text || 'Capturing screens...');
      setProgressPercent(crawl.progress_percent || 50);
      await loadGallery(crawl.run_id);
      setupWebSocket(crawl.run_id);
    } else {
      setRunStatus('completed');
      await loadGallery(crawl.run_id);
    }
  };

  const handleToggleRoute = async (routeId: string, currentSelected: boolean) => {
    try {
      await fetch('/api/routes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route_id: routeId, is_selected: !currentSelected }),
      });
      if (currentRunId) loadDiscoveredRoutes(currentRunId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePattern = async (pattern: string, selectAll: boolean) => {
    if (!currentRunId) return;
    try {
      await fetch('/api/routes/toggle-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: currentRunId, pattern, is_selected: selectAll }),
      });
      loadDiscoveredRoutes(currentRunId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProceedToCapture = async (config: any) => {
    if (!currentRunId) return;
    try {
      setRunStatus('capturing');
      setProgressText('Starting capture workers...');
      setProgressPercent(10);

      const res = await fetch(`/api/runs/${currentRunId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewports: config.viewports,
          themes: config.themes,
          include_fold: config.include_fold ?? false,
        }),
      });

      if (!res.ok) throw new Error('Capture failed to start');
    } catch (e: any) {
      alert(`Failed to launch capture: ${e.message}`);
    }
  };

  const handleRecaptureRoutes = async (routePaths: string[]) => {
    if (!currentRunId || routePaths.length === 0) return;
    try {
      setRunStatus('capturing');
      setProgressText(`Recapturing ${routePaths.length} route(s)...`);
      setProgressPercent(10);

      const res = await fetch(`/api/runs/${currentRunId}/recapture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_paths: routePaths,
        }),
      });

      if (!res.ok) throw new Error('Recapture failed to start');
    } catch (e: any) {
      alert(`Failed to launch recapture: ${e.message}`);
    }
  };

  const handleBackToHome = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setCurrentRunId(null);
    setRunStatus(null);
    setPatterns([]);
    setGalleryScreens([]);
    setGallerySections([]);
    setGalleryModals([]);
    setGalleryComponents([]);
    setGalleryTokens([]);
    fetchCrawls();
  };

  const activeProfile = profiles.find((p) => p.id === selectedProfileId);

  const filteredCrawls = crawls.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.site_name.toLowerCase().includes(q) ||
      c.base_url.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#131415] text-white font-sans">
      {/* Minimal Uncluttered Top Bar (shown when on Home views so user can switch between Wireframe 1 & Wireframe 4 and manage Auth Sessions) */}
      {!runStatus && (
        <header className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-[80px] pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHomeMode('new_crawl')}
              className={`px-4 py-2.5 rounded-[12px] text-[15px] leading-[22px] transition cursor-pointer ${
                homeMode === 'new_crawl'
                  ? 'bg-[#252627] text-white'
                  : 'text-[#7E7E81] hover:text-white'
              }`}
            >
              New crawl
            </button>
            <button
              onClick={() => {
                fetchCrawls();
                setHomeMode('my_crawls');
              }}
              className={`px-4 py-2.5 rounded-[12px] text-[15px] leading-[22px] flex items-center gap-2 transition cursor-pointer ${
                homeMode === 'my_crawls'
                  ? 'bg-[#252627] text-white'
                  : 'text-[#7E7E81] hover:text-white'
              }`}
            >
              <span>My crawls</span>
              {crawls.length > 0 && (
                <span className="text-[13px] text-[#7E7E81]">{crawls.length}</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchProfiles();
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-[12px] border border-[#242628] hover:bg-[#242628]/60 text-[15px] leading-[22px] text-white flex items-center gap-2 transition cursor-pointer"
            >
              <span>{activeProfile ? `Session: ${activeProfile.name}` : 'Auth sessions'}</span>
              {profiles.length > 0 && (
                <span className="text-[13px] text-[#7E7E81]">({profiles.length})</span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* WIREFRAME - 1: "Start your first crawl" (#29:2) */}
      {!runStatus && homeMode === 'new_crawl' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 lg:px-[80px] pb-16">
          <div className="w-full max-w-[800px] flex flex-col items-center gap-[24px]">
            <h1 className="text-[32px] leading-[40px] font-semibold text-white tracking-tight text-center">
              Start your first crawl
            </h1>

            <form
              onSubmit={handleStartDiscovery}
              className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-[6px]"
            >
              {/* URL Input Box (#30:7) */}
              <div className="flex-1 bg-[#242628] rounded-[12px] px-[24px] py-[16px] flex items-center justify-between gap-3 focus-within:ring-1 focus-within:ring-white/25 transition">
                <input
                  type="text"
                  placeholder="Enter an URL"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-[16px] leading-[24px] text-white placeholder-[#7E7E81] focus:outline-none"
                />

                {activeProfile && (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-2.5 py-1 rounded-[8px] bg-[#131415] text-[13px] text-[#7E7E81] hover:text-white shrink-0 transition cursor-pointer"
                    title="Authenticated session attached"
                  >
                    {activeProfile.name}
                  </button>
                )}
              </div>

              {/* Primary CTA Button (#30:51) */}
              <button
                type="submit"
                className="bg-white hover:bg-white/90 text-[#262627] rounded-[12px] px-[24px] py-[16px] text-[16px] leading-[24px] font-normal whitespace-nowrap transition cursor-pointer"
              >
                New crawl
              </button>
            </form>
          </div>
        </main>
      )}

      {/* WIREFRAME - 4: "My crawls" (#30:248) */}
      {!runStatus && homeMode === 'my_crawls' && (
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-[80px] pt-10 lg:pt-[56px] pb-[40px] flex flex-col gap-[40px]">
          {/* Header Row (#30:252) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-[32px] leading-[40px] font-bold text-white tracking-tight">
              My crawls
            </h1>

            {/* Search Input (#30:304 / #30:305) */}
            <div className="w-full md:w-[411px] bg-[#242628] rounded-[12px] px-[16px] py-[12px] flex items-center gap-[8px] focus-within:ring-1 focus-within:ring-white/25 transition">
              <img src="/assets/figma/icon-search.svg" width={24} height={24} alt="" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[16px] leading-[24px] text-white placeholder-[#7E7E81] focus:outline-none"
              />
            </div>
          </div>

          {/* Crawl Cards Grid (#30:279) */}
          {filteredCrawls.length === 0 ? (
            <div className="bg-[#0C0D0D] rounded-[24px] p-12 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-[16px] leading-[24px] text-[#7E7E81]">
                {crawls.length === 0
                  ? 'You have not run any crawls yet.'
                  : 'No crawls match your search.'}
              </p>
              {crawls.length === 0 && (
                <button
                  onClick={() => setHomeMode('new_crawl')}
                  className="bg-white hover:bg-white/90 text-[#262627] rounded-[12px] px-6 py-3 text-[16px] leading-[24px] transition cursor-pointer"
                >
                  Start your first crawl
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
              {filteredCrawls.map((crawl) => (
                <div
                  key={crawl.run_id}
                  onClick={() => handleOpenExistingCrawl(crawl)}
                  className="group bg-[#0C0D0D] rounded-[24px] p-[24px] flex flex-col gap-[16px] border border-transparent hover:border-[#242628] transition cursor-pointer"
                >
                  {/* Thumbnail Preview (#30:281 — EL-cde1ee1c) */}
                  <div className="relative bg-[#1D1D1E] rounded-[12px] h-[258px] overflow-hidden flex items-start justify-center">
                    {crawl.preview_url ? (
                      <img
                        src={crawl.preview_url}
                        alt={crawl.site_name}
                        className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[15px] text-[#7E7E81] font-mono px-4 text-center">
                        {crawl.base_url}
                      </div>
                    )}
                  </div>

                  {/* Card Text Info (#30:282 — EL-e03b43ef) */}
                  <div className="px-[12px] flex flex-col gap-[8px]">
                    <div className="text-[16px] leading-[24px] text-white font-normal truncate">
                      {crawl.site_name}
                    </div>
                    <div className="flex items-center gap-[8px] text-[16px] leading-[24px] text-[#7E7E81] flex-wrap">
                      <span>{crawl.screens_count} screens</span>
                      <span>{crawl.components_count} components</span>
                      <span>{crawl.tokens_count} tokens</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ACTIVE RUN VIEWS (Discovery Progress, Route Review, or Wireframe - 3 Site Gallery) */}
      {runStatus && (
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-[80px] pt-10 lg:pt-[80px] pb-[40px] flex flex-col gap-[40px]">
          {/* Discovering State */}
          {runStatus === 'discovering' && (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <LiveCrawlProgress
                text={progressText}
                percent={progressPercent}
                status={runStatus}
                targetUrl={currentBaseUrl}
                onCancel={handleBackToHome}
              />
            </div>
          )}

          {/* Failed State */}
          {runStatus === 'failed' && (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <LiveCrawlProgress
                text={progressText}
                percent={progressPercent}
                status={runStatus}
                targetUrl={currentBaseUrl}
                onCancel={handleBackToHome}
              />
            </div>
          )}

          {/* Route Review State */}
          {runStatus === 'review_pending' && (
            <DiscoveryReview
              runId={currentRunId || ''}
              siteName={currentSiteName}
              baseUrl={currentBaseUrl}
              patterns={patterns}
              onToggleRoute={handleToggleRoute}
              onTogglePattern={handleTogglePattern}
              onProceedToCapture={handleProceedToCapture}
              onBack={handleBackToHome}
            />
          )}

          {/* WIREFRAME - 3: Site Detail & Gallery View (#30:192) */}
          {(runStatus === 'capturing' || runStatus === 'completed') && (
            <>
              {runStatus === 'capturing' && (
                <LiveCrawlProgress
                  text={progressText}
                  percent={progressPercent}
                  status={runStatus}
                  targetUrl={currentBaseUrl}
                />
              )}
              <StudioGallery
                runId={currentRunId || ''}
                siteName={currentSiteName}
                baseUrl={currentBaseUrl}
                screens={galleryScreens}
                sections={gallerySections}
                modals={galleryModals}
                components={galleryComponents}
                tokens={galleryTokens}
                onReset={handleBackToHome}
                onRecapture={handleRecaptureRoutes}
                isLiveCapturing={runStatus === 'capturing'}
              />
            </>
          )}
        </main>
      )}

      {/* Auth Session Vault Modal */}
      <AuthVaultModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          fetchProfiles();
        }}
        selectedProfileId={selectedProfileId}
        onProfileSelected={(id) => setSelectedProfileId(id)}
      />
    </div>
  );
}

export default App;
