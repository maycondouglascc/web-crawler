import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LiveCrawlProgressProps {
  text: string;
  percent: number;
  status: 'discovering' | 'capturing' | 'review_pending' | 'completed' | 'failed';
  targetUrl?: string;
  onCancel?: () => void;
}

export const LiveCrawlProgress: React.FC<LiveCrawlProgressProps> = ({
  text,
  percent,
  status,
  targetUrl,
  onCancel,
}) => {
  const isDiscovering = status === 'discovering';
  const isFailed = status === 'failed';

  return (
    <div className="w-full max-w-[800px] mx-auto bg-[#0C0D0D] border border-[#242628] rounded-[24px] p-6 md:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-[#1D1D1E] flex items-center justify-center text-white shrink-0">
            {isFailed ? (
              <AlertCircle size={22} className="text-red-400" />
            ) : status === 'completed' || status === 'review_pending' ? (
              <CheckCircle2 size={22} className="text-white" />
            ) : (
              <Loader2 size={22} className="animate-spin text-white" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[16px] leading-[24px] font-medium text-white">
                {isDiscovering
                  ? 'Discovering routes & structure'
                  : isFailed
                  ? 'Crawl encountered an error'
                  : 'Capturing screens, sections & tokens'}
              </span>
              {targetUrl && (
                <span className="text-[14px] leading-[20px] text-[#7E7E81] font-mono truncate max-w-[260px]">
                  {targetUrl}
                </span>
              )}
            </div>
            <p className="text-[16px] leading-[24px] text-[#7E7E81]">{text}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[16px] leading-[24px] text-white">
            {percent}%
          </span>
          {isFailed && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-[12px] border border-[#242628] hover:bg-[#242628] text-[14px] text-white transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Minimalist High-Contrast Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#1D1D1E] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isFailed ? 'bg-red-500' : 'bg-white'
          }`}
          style={{ width: `${Math.max(5, percent)}%` }}
        />
      </div>
    </div>
  );
};
