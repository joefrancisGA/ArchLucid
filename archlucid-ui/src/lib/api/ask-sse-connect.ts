import { getServerApiBaseUrl } from "@/lib/config";
import { getServerUpstreamAuthHeaders } from "@/lib/legacy-arch-env";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { getScopeHeaders } from "@/lib/scope";
import { getBearerToken, isBrowser } from "./http";

export function resolveAskStreamRequest(path: string): { url: string; headers: HeadersInit } {
  if (isBrowser()) {
    const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      ...getEffectiveBrowserProxyScopeHeaders(),
    };
    const bearer = getBearerToken();

    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    return { url, headers };
  }

  const base = getServerApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  return {
    url,
    headers: {
      Accept: "text/event-stream",
      ...getScopeHeaders(),
      ...getServerUpstreamAuthHeaders(),
    },
  };
}
