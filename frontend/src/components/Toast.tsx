"use client";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import React from "react";

export type ToastType = "success" | "error" | "info";
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const icons = {
  success: <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
  info: <AlertCircle size={18} className="text-blue-400 flex-shrink-0" />,
};

const bg = {
  success: "border-green-500/30 bg-zinc-900",
  error: "border-red-500/30 bg-zinc-900",
  info: "border-blue-500/30 bg-zinc-900",
};

interface ToastContextValue {
  toast: (msg: string, type?: ToastType) => void;
}
export const ToastContext = React.createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm text-white ${bg[t.type]}`}
            >
              {icons[t.type]}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors -mt-0.5">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
