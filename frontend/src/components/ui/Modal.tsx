import React from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg";
};

export function Modal({ title, description, onClose, children, footer, width = "lg" }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-card border border-line bg-overlay-surface ${
          width === "md" ? "max-w-lg" : "max-w-2xl"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 id="modal-title" className="text-body font-bold text-white">
              {title}
            </h2>
            {description && <p className="text-label text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
