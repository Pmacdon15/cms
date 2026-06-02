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
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-default border-none w-full h-full"
        type="button"
        aria-label="Close dialog"
      />

      {/* Modal Box */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all duration-300 transform scale-100 opacity-100 flex flex-col z-10 animate-fade-in-scale"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors text-lg"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 text-zinc-300">{children}</div>
      </div>
    </div>
  );
}

export default Dialog;
