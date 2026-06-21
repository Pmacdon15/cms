"use client";

import * as React from "react";
import { cn } from "../../utils/cn";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Premium custom glassmorphic Modal Dialog
 */
export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <button
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default border-none bg-black/40 backdrop-blur-sm"
        type="button"
        aria-label="Close dialog"
      />

      {/* Modal Box */}
      <div
        className={cn(
          "relative z-10 flex w-full max-w-lg scale-100 transform animate-fade-in-scale flex-col rounded-2xl border border-zinc-200 bg-white p-6 opacity-100 shadow-2xl transition-all duration-300",
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between border-zinc-100 border-b pb-4">
          <h2 className="font-bold text-lg text-zinc-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-lg text-zinc-400 transition-colors hover:text-zinc-600"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 text-zinc-600">{children}</div>
      </div>
    </div>
  );
}

export default Dialog;
