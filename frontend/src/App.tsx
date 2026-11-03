import React, { useState, useEffect, useRef } from 'react';
import { Camera, KeyRound, Globe, Play, Sparkles, Layers, Sliders, Shield, RefreshCw, FolderKanban } from 'lucide-react';
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

export function App() {
  const [targetUrl, setTargetUrl] = useState('http://localhost:5173');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Run State
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<any>(null);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Discovered Patterns
  const [patterns, setPatterns] = useState<any[]>([]);

  // Gallery Assets
  const [galleryScreens, setGalleryScreens] = useState<any[]>([]);
  const [gallerySections, setGallerySections] = useState<any[]>([]);
  const [galleryComponents, setGalleryComponents] = useState<any[]>([]);

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

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleStartDiscovery = async () => {
    if (!targetUrl) return;

    try {
      // Clear old gallery
      setGalleryScreens([]);
      setGallerySections([]);
      setGalleryComponents([]);
      setPatterns([]);

      // 1. Create or ensure project
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: new URL(targetUrl).hostname || 'Local Project',
          base_url: targetUrl,
          auth_profile_id: selectedProfileId || null,
        }),
      });

      if (!projRes.ok) throw new Error('Failed to create project');
      const project = await projRes.json();

      // 2. Start discovery
      const discRes = await fetch(`/api/projects/${project.id}/discover`, {
        method: 'POST',
      });

      if (!discRes.ok) throw new Error('Failed to start discovery');
      const discData = await discRes.json();

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
          }
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    wsRef.current = ws;
  };

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
        setGalleryScreens(data.screens || []);
        setGallerySections(data.sections || []);
        setGalleryComponents(data.components || []);
      }
    } catch (e) {
      console.error('Failed to load gallery:', e);
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
        }),
      });

      if (!res.ok) throw new Error('Capture failed to start');
    } catch (e: any) {
      alert(`Failed to launch capture: ${e.message}`);
    }
  };

  const handleResetRun = () => {
    setCurrentRunId(null);
    setRunStatus(null);
    setPatterns([]);
    setGalleryScreens([]);
    setGallerySections([]);
    setGalleryComponents([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Camera size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">Visual Studio</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20 font-medium">
                v1.0 Local
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Web & App Visual Intelligence Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {runStatus === 'completed' && (
            <button
              onClick={handleResetRun}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>New Run</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchProfiles();
              setIsAuthModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <KeyRound size={15} className="text-emerald-400" />
            <span>Auth Session Vault</span>
            {profiles.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono flex items-center justify-center border border-emerald-500/20">
                {profiles.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Launcher Card (Hidden if Gallery is ready, or collapsible) */}
        {runStatus !== 'completed' && (
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/60 border border-slate-800/80 shadow-2xl space-y-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Crawl, Capture & Reverse-Engineer Any Web App
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                Supports public sites, <span className="text-emerald-400 font-medium">localhost</span>, and authenticated SaaS apps. Discovers all routes, auto-groups dynamic patterns, and captures pixel-perfect lossless UI inventories.
              </p>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target URL (Localhost or Public)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type="url"
                    placeholder="http://localhost:5173 or https://app.example.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Authenticated Session
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="">Public / Unauthenticated</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      🔑 {p.name} ({p.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleStartDiscovery}
                  disabled={!targetUrl || runStatus === 'discovering' || runStatus === 'capturing'}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Play size={14} className="fill-current" />
                  <span>Smart Crawl</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Progress Bar if active */}
        {runStatus && runStatus !== 'completed' && (
          <LiveCrawlProgress
            text={progressText}
            percent={progressPercent}
            status={runStatus}
          />
        )}

        {/* Discovery Review Step */}
        {runStatus === 'review_pending' && patterns.length > 0 && (
          <DiscoveryReview
            runId={currentRunId || ''}
            patterns={patterns}
            onToggleRoute={handleToggleRoute}
            onTogglePattern={handleTogglePattern}
            onProceedToCapture={handleProceedToCapture}
          />
        )}

        {/* Completed Gallery View */}
        {runStatus === 'completed' && (
          <StudioGallery
            screens={galleryScreens}
            sections={gallerySections}
            components={galleryComponents}
            onReset={handleResetRun}
          />
        )}
      </main>

      {/* Auth Vault Modal */}
      <AuthVaultModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          fetchProfiles();
        }}
        onProfileSelected={(id) => setSelectedProfileId(id)}
      />
    </div>
  );
}

export default App;
