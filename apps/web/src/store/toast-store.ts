"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "warn" | "error";

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
};

const ttlByVariant: Record<ToastVariant, number> = {
  success: 2800,
  warn: 3600,
  error: 4500,
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast }],
    }));

    window.setTimeout(() => {
      get().removeToast(id);
    }, ttlByVariant[toast.variant]);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
