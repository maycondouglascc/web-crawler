import React, { useState, useEffect } from 'react';
import { ExternalLink, Trash2, X, Loader2 } from 'lucide-react';

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
  selectedProfileId?: string;
  onProfileSelected?: (profileId: string) => void;
}

export const AuthVaultModal: React.FC<AuthVaultModalProps> = ({
  isOpen,
  onClose,
  selectedProfileId = '',
  onProfileSelected,
}) => {
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
    if (!confirm('Remove this saved authenticated session?')) return;
    try {
      await fetch(`/api/auth/profiles/${id}`, { method: 'DELETE' });
      if (selectedProfileId === id && onProfileSelected) {
        onProfileSelected('');
      }
      await fetchProfiles();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-[#0C0D0D] border border-[#242628] rounded-[24px] p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[24px] leading-[32px] font-bold text-white">Authenticated sessions</h2>
            <p className="text-[16px] leading-[24px] text-[#7E7E81]">
              Sign in once via a secure Chromium window to crawl private dashboards and SaaS apps.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7E7E81] hover:text-white rounded-[12px] hover:bg-[#242628] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex flex-col gap-6 pr-1">
          {/* New Session Form */}
          <form onSubmit={handleLaunchLogin} className="bg-[#131415] rounded-[16px] p-5 flex flex-col gap-4 border border-[#242628]">
            <div className="text-[16px] leading-[24px] text-white font-medium">
              Record a new session
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="url"
                placeholder="Login URL (https://app.example.com/login)"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#242628] rounded-[12px] text-[15px] leading-[22px] text-white placeholder-[#7E7E81] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Label (optional, e.g. Staging Admin)"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 bg-[#242628] rounded-[12px] text-[15px] leading-[22px] text-white placeholder-[#7E7E81] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
              <span className="text-[13px] text-[#7E7E81]">
                Safe-crawl guardrails automatically block logouts and destructive requests.
              </span>
              <button
                type="submit"
                disabled={isLaunching || !loginUrl}
                className="px-5 py-2.5 bg-white hover:bg-white/90 disabled:opacity-40 text-[#262627] text-[15px] leading-[22px] font-medium rounded-[12px] flex items-center gap-2 transition cursor-pointer"
              >
                {isLaunching ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Browser open...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={15} />
                    <span>Launch login browser</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Saved Sessions List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#7E7E81]">Saved sessions</span>
              {selectedProfileId && onProfileSelected && (
                <button
                  onClick={() => onProfileSelected('')}
                  className="text-[13px] text-[#7E7E81] hover:text-white transition cursor-pointer"
                >
                  Use public (unauthenticated)
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#7E7E81] text-[15px]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-white" />
                Loading sessions...
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-8 text-center bg-[#131415] rounded-[16px] text-[#7E7E81] text-[15px]">
                No authenticated sessions saved yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {profiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-4 rounded-[16px] border transition ${
                        isSelected
                          ? 'bg-[#1D1D1E] border-white/40'
                          : 'bg-[#131415] border-[#242628] hover:border-[#36383B]'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[16px] leading-[24px] text-white flex items-center gap-2">
                          <span>{p.name}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-[6px] bg-white text-[#262627] text-[11px] font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[14px] leading-[20px] text-[#7E7E81] flex items-center gap-2">
                          <span className="font-mono">{p.domain}</span>
                          <span>•</span>
                          <span>{p.cookie_count} cookies</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onProfileSelected && (
                          <button
                            onClick={() => {
                              onProfileSelected(isSelected ? '' : p.id);
                              onClose();
                            }}
                            className={`px-3.5 py-2 rounded-[12px] text-[14px] transition cursor-pointer ${
                              isSelected
                                ? 'border border-[#242628] text-white hover:bg-[#242628]'
                                : 'bg-white text-[#262627] hover:bg-white/90'
                            }`}
                          >
                            {isSelected ? 'Deselect' : 'Select'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          className="p-2 text-[#7E7E81] hover:text-red-400 rounded-[10px] hover:bg-[#242628] transition cursor-pointer"
                          title="Delete session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
