/** Safely read a public env var from Next.js or Vite without throwing during SSR. */
export function getClientEnv(key: string, fallback = ""): string {
  const nextKey = key.startsWith("VITE_") ? `NEXT_PUBLIC_${key.slice(5)}` : key;
  const nextVal = typeof process !== "undefined" ? process.env[nextKey] : undefined;
  if (typeof nextVal === "string" && nextVal.length > 0) {
    return nextVal;
  }

  try {
    const viteEnv =
      typeof import.meta !== "undefined" ? import.meta.env : undefined;
    const viteVal = viteEnv?.[key];
    if (typeof viteVal === "string" && viteVal.length > 0) {
      return viteVal;
    }
  } catch {
    // import.meta is unavailable outside Vite.
  }

  return fallback;
}

/** Resolves API base URL for both Vite (`VITE_API_URL`) and Next.js (`NEXT_PUBLIC_API_URL`). */
export function getApiBaseUrl(): string {
  return getClientEnv("VITE_API_URL", "/api");
}
