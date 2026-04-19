"use client";

import { useToastStore } from "@/store/toast-store";

export function ToastStack() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <aside className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.variant}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => removeToast(toast.id)} aria-label="dismiss">
            ×
          </button>
        </div>
      ))}
    </aside>
  );
}
