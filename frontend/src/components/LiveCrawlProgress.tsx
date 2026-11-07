import React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface LiveCrawlProgressProps {
  text: string;
  percent: number;
  status: "discovering" | "capturing" | "review_pending" | "completed" | "failed" | string;
}

export const LiveCrawlProgress: React.FC<LiveCrawlProgressProps> = ({ text, percent, status }) => {
  const failed = status === "failed";
  const done = status === "completed" || status === "review_pending";
  const title =
    status === "discovering"
      ? "Discovering routes"
      : status === "capturing"
        ? "Capturing pages"
        : status === "failed"
          ? "Crawl failed"
          : text;

  return (
    <div className="flex flex-col gap-4 rounded-card bg-sunken p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-control border ${
              failed ? "border-danger bg-danger-muted text-danger" : "border-line text-white"
            }`}
          >
            {failed ? (
              <AlertCircle size={24} />
            ) : done ? (
              <CheckCircle2 size={24} />
            ) : (
              <Loader2 size={24} className="animate-spin" />
            )}
          </div>
          <div>
            <h3 className="text-body text-white">{title}</h3>
            <p className="text-label text-muted">{text}</p>
          </div>
        </div>
        <p className="text-body text-white">{percent}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-control bg-canvas">
        <div
          className={`h-full rounded-control transition-all duration-300 ${failed ? "bg-danger" : "bg-white"}`}
          style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
};
