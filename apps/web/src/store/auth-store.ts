"use client";

import { create } from "zustand";

type Role = "USER" | "ADMIN";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem("crop-advisor-auth");
    if (!raw) {
      set({ hydrated: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { token: string; refreshToken: string; user: User };
      set({ token: parsed.token, refreshToken: parsed.refreshToken, user: parsed.user, hydrated: true });
    } catch {
      set({ token: null, refreshToken: null, user: null, hydrated: true });
    }
  },
  setAuth: (token, refreshToken, user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("crop-advisor-auth", JSON.stringify({ token, refreshToken, user }));
    }
    set({ token, refreshToken, user });
  },
  setTokens: (token, refreshToken) => {
    set((state) => {
      if (typeof window !== "undefined" && state.user) {
        window.localStorage.setItem(
          "crop-advisor-auth",
          JSON.stringify({ token, refreshToken, user: state.user }),
        );
      }
      return { token, refreshToken };
    });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("crop-advisor-auth");
    }
    set({ token: null, refreshToken: null, user: null });
  },
}));

export type { User, Role };
