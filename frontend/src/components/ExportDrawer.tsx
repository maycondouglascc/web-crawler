import React, { useState } from 'react';
import { Download, FileText, Code2, Globe, Sparkles, X, Check, ExternalLink } from 'lucide-react';

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
      name: 'CONTEXT.md',
      title: 'AI Coding Agent Context Pack',
      description: 'Route map, section screenshots, and component inventories formatted for Antigravity, Cursor, and Claude Code.',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      filename: 'CONTEXT.md',
    },
    {
      name: 'DESIGN_SYSTEM.md',
      title: 'Design System Audit Report',
      description: 'Human-readable Markdown tables with color swatches, typography scales, radii, and box shadows.',
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      filename: 'DESIGN_SYSTEM.md',
    },
    {
      name: 'tokens.json',
      title: 'W3C Standard Design Tokens',
      description: 'Structured JSON tokens ready for Figma token plugins, Tailwind themes, or design system code.',
      icon: Code2,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      filename: 'tokens.json',
    },
    {
      name: 'gallery.html',
      title: 'Standalone Portable Gallery',
      description: 'Zero-dependency offline visual gallery you can zip and email to clients or team members.',
      icon: Globe,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
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
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exports & Intelligence Packs</h2>
              <p className="text-xs text-slate-400">Download design tokens, AI context packs, and portable client galleries.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {exportFiles.map((file) => {
            const Icon = file.icon;
            const isDone = downloading === file.filename;

            return (
              <div
                key={file.filename}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${file.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{file.title}</span>
                      <span className="font-mono text-[11px] text-slate-400 font-normal">({file.filename})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{file.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(file.filename)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 shrink-0 border border-slate-700 transition"
                >
                  {isDone ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <span>All exports are generated locally and persisted in the project run directory.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
