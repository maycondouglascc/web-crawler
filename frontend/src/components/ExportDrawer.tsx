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
    description: "Colors, type, radii, and shadows read from the crawled site.",
  },
  {
    filename: "tokens.json",
    title: "tokens.json",
    description: "The same tokens as structured JSON.",
  },
  {
    filename: "CONTEXT.md",
    title: "CONTEXT.md",
    description: "Route map, sections, and components for a coding agent.",
  },
  {
    filename: "llms.txt",
    title: "llms.txt",
    description: "A short index that points an agent at CONTEXT.md.",
  },
  {
    filename: "gallery.html",
    title: "Image gallery",
    description: "A portable page of the captured screens.",
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
      title="Export design.md"
      description="The design file is the audit of the crawled site. The other files travel with it."
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        {EXPORT_FILES.map((file) => (
          <div key={file.filename} className="flex items-center justify-between gap-4 rounded-control bg-sunken px-4 py-4">
            <div className="min-w-0">
              <p className="text-body text-white">{file.title}</p>
              <p className="mt-2 text-label text-muted">{file.description}</p>
            </div>
            <Button variant="secondary" onClick={() => handleDownload(file.filename)}>
              {downloading === file.filename ? "Saved" : "Download"}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
};
