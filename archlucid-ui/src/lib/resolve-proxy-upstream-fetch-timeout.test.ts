import { describe, expect, it } from "vitest";

import {
  PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS,
  PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS,
} from "@/lib/server-fetch-timeouts";
import { resolveProxyUpstreamFetchTimeout } from "@/lib/resolve-proxy-upstream-fetch-timeout";

describe("resolveProxyUpstreamFetchTimeout", () => {
  it("uses the default budget for ordinary JSON POSTs", () => {
    expect(resolveProxyUpstreamFetchTimeout("v1/architecture/request")).toEqual({
      timeoutMs: PROXY_UPSTREAM_FETCH_TIMEOUT_MS,
      kind: "default",
    });
  });

  it("uses the LLM advisory budget for structured-brief suggest", () => {
    expect(resolveProxyUpstreamFetchTimeout("v1/architecture/request/draft")).toEqual({
      timeoutMs: PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS,
      kind: "llm-advisory",
    });
  });

  it("uses the LLM advisory budget for overview rewrite and suggestion explain", () => {
    expect(resolveProxyUpstreamFetchTimeout("v1/architecture/request/draft/overview-rewrite")).toEqual({
      timeoutMs: PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS,
      kind: "llm-advisory",
    });
    expect(resolveProxyUpstreamFetchTimeout("v1/architecture/request/draft/suggestion/explain")).toEqual({
      timeoutMs: PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS,
      kind: "llm-advisory",
    });
  });

  it("uses the upload budget for multipart evidence", () => {
    expect(
      resolveProxyUpstreamFetchTimeout(
        "v1/architecture/review/r1/evidence/bulk",
        "multipart/form-data; boundary=----x",
      ),
    ).toEqual({
      timeoutMs: PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS,
      kind: "large-upload",
    });
  });

  it("uses the catalog reset budget for development SQL reset", () => {
    expect(resolveProxyUpstreamFetchTimeout("v1/diagnostics/reset-development-catalog")).toEqual({
      timeoutMs: PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS,
      kind: "catalog-reset",
    });
  });
});
