import React, { useState } from 'react';
import { Download, X, Check } from 'lucide-react';

interface ExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  runId: string;
}

export const ExportDrawer: React.FC<ExportDrawerProps> = ({ isOpen, onClose, runId }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportFiles = [
    {
      name: 'DESIGN_SYSTEM.md',
      title: 'Design system specification (design.md)',
      description: 'Markdown tables with extracted color tokens, typography scale, border radii, and elevation shadows.',
      filename: 'DESIGN_SYSTEM.md',
    },
    {
      name: 'images.zip',
      title: 'All captured images (images.zip)',
      description: 'Full-resolution screens, semantic page sections, modals, and harvested UI component crops.',
      filename: 'images.zip',
    },
    {
      name: 'CONTEXT.md',
      title: 'AI coding agent context pack (CONTEXT.md)',
      description: 'Route hierarchy, section breakdown, and component inventory formatted for AI coding assistants.',
      filename: 'CONTEXT.md',
    },
    {
      name: 'tokens.json',
      title: 'W3C design tokens (tokens.json)',
      description: 'Structured JSON tokens ready for Figma token plugins, Tailwind config, or CSS variable generation.',
      filename: 'tokens.json',
    },
    {
      name: 'gallery.html',
      title: 'Portable standalone gallery (gallery.html)',
      description: 'Zero-dependency offline visual gallery for sharing with stakeholders.',
      filename: 'gallery.html',
    },
  ];

  const handleDownload = (filename: string) => {
    setDownloading(filename);
    const link = document.createElement('a');
    link.href = `/api/runs/${runId}/exports/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-[#0C0D0D] border border-[#242628] rounded-[24px] p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[24px] leading-[32px] font-bold text-white">Export crawl artifacts</h2>
            <p className="text-[16px] leading-[24px] text-[#7E7E81]">
              Download design specs, screenshot archives, and AI context files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7E7E81] hover:text-white rounded-[12px] hover:bg-[#242628] transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-3 pr-1">
          {exportFiles.map((file) => {
            const isDone = downloading === file.filename;

            return (
              <div
                key={file.filename}
                className="p-5 rounded-[16px] bg-[#131415] border border-[#242628] hover:border-[#36383B] transition flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[16px] leading-[24px] text-white font-medium truncate">
                    {file.title}
                  </div>
                  <p className="text-[14px] leading-[20px] text-[#7E7E81]">
                    {file.description}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(file.filename)}
                  className="px-4 py-2.5 rounded-[12px] bg-white hover:bg-white/90 text-[#262627] text-[14px] leading-[20px] font-medium flex items-center gap-2 shrink-0 transition cursor-pointer"
                >
                  {isDone ? (
                    <>
                      <Check size={15} />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Export</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
