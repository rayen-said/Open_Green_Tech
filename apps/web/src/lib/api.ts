import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
});

export function setApiToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const store = useAuthStore.getState();

    if (error.response?.status === 401 && !originalRequest?._retry && store.refreshToken) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken: store.refreshToken,
        });
        const { accessToken, refreshToken } = refreshResponse.data;
        store.setTokens(accessToken, refreshToken);
        setApiToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        store.logout();
      }
    }

    return Promise.reject(error);
  },
);
