"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  addToastFn?.(message, type);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const iconMap = {
    success: <Check size={16} />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />,
  };

  const colorMap = {
    success: "bg-sage-50 text-sage-800 border-sage-200",
    error: "bg-blush-50 text-blush-600 border-blush-200",
    info: "bg-warm-50 text-warm-800 border-warm-200",
  };

  return (
    <>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${colorMap[t.type]} border rounded-card px-4 py-3 flex items-center gap-3 shadow-lifted animate-slide-up pointer-events-auto`}
          >
            {iconMap[t.type]}
            <span className="text-body-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
