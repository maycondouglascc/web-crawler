import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  runId: string;
}

const EXPORT_FILES = [
  {
    filename: "DESIGN_SYSTEM.md",
    title: "design.md",
    description: "Colors, typography scale, border radii, and elevation shadows extracted from the crawled site.",
  },
  {
    filename: "images.zip",
    title: "images.zip",
    description: "Complete ZIP archive of captured full-page screens, sliced sections, modals, and UI components.",
  },
  {
    filename: "tokens.json",
    title: "tokens.json",
    description: "W3C-structured JSON design tokens ready for Figma plugins, Tailwind, or CSS variables.",
  },
  {
    filename: "CONTEXT.md",
    title: "CONTEXT.md",
    description: "Route map, semantic sections, and component inventory formatted for AI coding agents.",
  },
  {
    filename: "llms.txt",
    title: "llms.txt",
    description: "Compact index pointing AI agents to the crawl specifications and assets.",
  },
  {
    filename: "gallery.html",
    title: "gallery.html",
    description: "Standalone zero-dependency HTML visual gallery for offline sharing.",
  },
];

export const ExportDrawer: React.FC<ExportDrawerProps> = ({ isOpen, onClose, runId }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = (filename: string) => {
    setDownloading(filename);
    const link = document.createElement("a");
    link.href = `/api/runs/${runId}/exports/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <Modal
      title="Export design.md & artifacts"
      description="Download the audited design system, raw image archive, or AI coding context packs."
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        {EXPORT_FILES.map((file, idx) => (
          <div key={file.filename} className="flex items-center justify-between gap-4 rounded-control bg-sunken px-4 py-4">
            <div className="min-w-0">
              <p className="text-body text-white">{file.title}</p>
              <p className="mt-1 text-label text-muted">{file.description}</p>
            </div>
            <Button
              variant={idx === 0 ? "primary" : "secondary"}
              onClick={() => handleDownload(file.filename)}
            >
              {downloading === file.filename ? "Saved" : "Download"}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
};
