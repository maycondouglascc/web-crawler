import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { TextField } from "./ui/TextField";

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
  const [loginUrl, setLoginUrl] = useState("");
  const [profileName, setProfileName] = useState("");

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const handleLaunchLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginUrl) return;

    try {
      setIsLaunching(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login_url: loginUrl,
          profile_name: profileName || `${new URL(loginUrl).hostname} Session`,
        }),
      });

      if (res.ok) {
        setLoginUrl("");
        setProfileName("");
        await fetchProfiles();
      }
    } catch (err) {
      console.error("Failed to launch login:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Remove this saved session?")) return;
    try {
      await fetch(`/api/auth/profiles/${id}`, { method: "DELETE" });
      await fetchProfiles();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Authenticated sessions"
      description="Log in once. Safe-crawl guardrails block logout and other destructive requests."
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <form onSubmit={handleLaunchLogin} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-label text-muted">Login URL</span>
            <TextField
              fieldSize="default"
              type="url"
              required
              placeholder="https://app.example.com/login"
              value={loginUrl}
              onChange={(event) => setLoginUrl(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-label text-muted">Session label</span>
            <TextField
              fieldSize="default"
              type="text"
              placeholder="Staging admin"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={isLaunching}>
            {isLaunching ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{isLaunching ? "Login window open" : "Launch login window"}</span>
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        <h3 className="text-body text-white">Saved sessions</h3>
        {loading ? (
          <p className="text-body text-muted">Loading saved sessions</p>
        ) : profiles.length === 0 ? (
          <p className="rounded-card bg-sunken p-6 text-body text-muted">No saved sessions yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between gap-4 rounded-control bg-sunken px-4 py-3">
                <div className="min-w-0">
                  <p className="text-body text-white">{profile.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-label text-muted">
                    <span>{profile.domain}</span>
                    <span>{profile.cookie_count} cookies</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {onProfileSelected && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onProfileSelected(profile.id);
                        onClose();
                      }}
                    >
                      Use
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => handleDeleteProfile(profile.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
