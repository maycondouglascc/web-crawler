import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, Trash2, Plus, ShieldCheck, X, Loader2 } from 'lucide-react';

interface AuthProfile {
  id: string;
  name: string;
  domain: string;
  cookie_count: number;
  created_at: string;
}

interface AuthVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSelected?: (profileId: string) => void;
}

export const AuthVaultModal: React.FC<AuthVaultModalProps> = ({ isOpen, onClose, onProfileSelected }) => {
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [profileName, setProfileName] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const handleLaunchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUrl) return;

    try {
      setIsLaunching(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_url: loginUrl,
          profile_name: profileName || `${new URL(loginUrl).hostname} Session`,
        }),
      });

      if (res.ok) {
        setLoginUrl('');
        setProfileName('');
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Failed to launch login:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved session?')) return;
    try {
      await fetch(`/api/auth/profiles/${id}`, { method: 'DELETE' });
      await fetchProfiles();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Authenticated Session Vault</h2>
              <p className="text-xs text-slate-400">Log into protected apps once. Safe-Crawl guardrails block logouts.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* New Login Form */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" />
              Connect New Web App Session
            </h3>
            <form onSubmit={handleLaunchLogin} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Login / App URL</label>
                  <input
                    type="url"
                    placeholder="https://app.example.com/login"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Session Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Staging Admin / Prod Workspace"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Opens headed Chromium window. Supports Google OAuth, 2FA & Magic Links.</span>
                </div>
                <button
                  type="submit"
                  disabled={isLaunching || !loginUrl}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 transition"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Login Window Open...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} />
                      Launch Login Window
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Active Profiles List */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Saved Active Sessions</h3>
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading saved sessions...
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No active login sessions saved yet. Add one above to crawl logged-in apps.
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-sm font-medium text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-500">{p.domain}</span>
                          <span>•</span>
                          <span>{p.cookie_count} cookies captured</span>
                          <span>•</span>
                          <span>Saved {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onProfileSelected && (
                        <button
                          onClick={() => {
                            onProfileSelected(p.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition"
                        >
                          Use in Run
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProfile(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete session"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <span>Safe-Crawl guardrails automatically intercept & prevent destructive logouts.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
