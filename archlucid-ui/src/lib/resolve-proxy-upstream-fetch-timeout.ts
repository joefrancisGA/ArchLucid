import {
  isProxyDevelopmentCatalogResetRequest,
  isProxyLlmAdvisoryRequest,
  isProxyLargeUploadRequest,
} from "@/lib/proxy-constants";
import {
  PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS,
} from "@/lib/server-fetch-timeouts";

export type ProxyUpstreamTimeoutKind =
  | "default"
  | "llm-advisory"
  | "large-upload"
  | "catalog-reset";

export type ResolvedProxyUpstreamFetchTimeout = {
  readonly timeoutMs: number;
  readonly kind: ProxyUpstreamTimeoutKind;
};

/** Resolves the upstream fetch budget for a proxy forward (POST/PUT/PATCH/GET/DELETE). */
export function resolveProxyUpstreamFetchTimeout(
  pathForLog: string,
  contentType: string | null = null,
): ResolvedProxyUpstreamFetchTimeout {
  if (isProxyLargeUploadRequest(pathForLog, contentType)) {
    return { timeoutMs: PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS, kind: "large-upload" };
  }

  if (isProxyDevelopmentCatalogResetRequest(pathForLog)) {
    return { timeoutMs: PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS, kind: "catalog-reset" };
  }

  if (isProxyLlmAdvisoryRequest(pathForLog)) {
    return { timeoutMs: PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS, kind: "llm-advisory" };
  }

  return { timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS, kind: "default" };
}
