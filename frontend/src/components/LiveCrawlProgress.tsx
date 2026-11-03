import React from 'react';
import { Loader2, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface LiveCrawlProgressProps {
  text: string;
  percent: number;
  status: 'discovering' | 'capturing' | 'review_pending' | 'completed' | 'failed';
}

export const LiveCrawlProgress: React.FC<LiveCrawlProgressProps> = ({ text, percent, status }) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'failed' ? (
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle size={18} />
            </div>
          ) : status === 'completed' || status === 'review_pending' ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-white capitalize">
              {status === 'discovering' ? 'Discovering Routes & SPAs...' : text}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{text}</p>
          </div>
        </div>

        <div className="font-mono text-sm font-bold text-emerald-400">
          {percent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`}
          style={{ width: `${Math.max(5, percent)}%` }}
        />
      </div>
    </div>
  );
};
