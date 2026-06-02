"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// Global helper to trigger toast events from anywhere (server-actions callback or client mutation)
export const showToast = {
  success: (message: string) => {
    dispatchEvent(
      new CustomEvent("app-toast", { detail: { type: "success", message } }),
    );
  },
  error: (message: string) => {
    dispatchEvent(
      new CustomEvent("app-toast", { detail: { type: "error", message } }),
    );
  },
  info: (message: string) => {
    dispatchEvent(
      new CustomEvent("app-toast", { detail: { type: "info", message } }),
    );
  },
};

/**
 * Toast Container Component
 * Listens to "app-toast" custom events and renders active toasts in the bottom-right corner.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: ToastItem["type"];
        message: string;
      }>;
      const { type, message } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);

      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener("app-toast", handleToastEvent);
    return () => window.removeEventListener("app-toast", handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between p-4 rounded-xl border bg-white shadow-xl transition-all duration-300 transform translate-y-0 scale-100 animate-slide-in ${
            toast.type === "success"
              ? "border-emerald-200 text-zinc-900"
              : toast.type === "error"
                ? "border-red-200 text-zinc-900"
                : "border-zinc-200 text-zinc-900"
          }`}
        >
          <div className="flex gap-3">
            <span
              className={`mt-0.5 text-lg font-extrabold ${
                toast.type === "success"
                  ? "text-emerald-600"
                  : toast.type === "error"
                    ? "text-red-600"
                    : "text-blue-650"
              }`}
            >
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✕"}
              {toast.type === "info" && "ℹ"}
            </span>
            <p className="text-sm font-medium leading-5 text-zinc-800">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="ml-4 text-xs font-semibold text-zinc-450 hover:text-zinc-800 transition-colors cursor-pointer"
            type="button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
