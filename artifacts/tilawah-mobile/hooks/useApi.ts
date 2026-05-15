import { useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";

export function useApi() {
  const { baseUrl } = useAuth();

  const apiFetch = useCallback(
    async <T = unknown>(path: string, options?: RequestInit): Promise<T> => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message ?? `API error ${response.status}`);
      }
      return response.json() as Promise<T>;
    },
    [baseUrl]
  );

  return { apiFetch };
}
