const PROXY_PREFIX = "/api/proxy";

/**
 * Returns the backend-relative path for a same-origin proxy request (e.g. `/v1/authority/reviews/x`),
 * or null if the URL is not under `/api/proxy`.
 */
export function backendApiPath(url: URL): string | null {
  if (!url.pathname.startsWith(`${PROXY_PREFIX}/`) && url.pathname !== PROXY_PREFIX) {
    return null;
  }

  const rest = url.pathname.slice(PROXY_PREFIX.length);

  return rest.startsWith("/") ? rest : `/${rest}`;
}

export function matchesRunDetailGet(url: URL, runId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/authority/reviews/${encodeURIComponent(runId)}`
  );
}

/** Buyer-polished run detail (`GET /v1/authority/reviews/{runId}/buyer-summary`, TB-283). */
export function matchesBuyerRunDetailSummaryGet(url: URL, runId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/authority/reviews/${encodeURIComponent(runId)}/buyer-summary`
  );
}

export function matchesAuthorityRunManifestGet(url: URL, runId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/authority/reviews/${encodeURIComponent(runId)}/signed-review-record`
  );
}

export function matchesManifestSummaryGet(url: URL, manifestId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/authority/signed-review-records/${encodeURIComponent(manifestId)}/summary`
  );
}

export function matchesArtifactListGet(url: URL, manifestId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/artifacts/signed-review-records/${encodeURIComponent(manifestId)}`
  );
}

export function matchesArtifactBundleGet(url: URL, manifestId: string): boolean {
  return (
    url.search === "" &&
    backendApiPath(url) === `/v1/artifacts/signed-review-records/${encodeURIComponent(manifestId)}/bundle`
  );
}

export function matchesLegacyCompareRunsGet(url: URL, leftRunId: string, rightRunId: string): boolean {
  if (backendApiPath(url) !== "/v1/authority/compare/runs") {
    return false;
  }

  return (
    url.searchParams.get("leftRunId") === leftRunId && url.searchParams.get("rightRunId") === rightRunId
  );
}

export function matchesStructuredCompareGet(url: URL, baseRunId: string, targetRunId: string): boolean {
  if (backendApiPath(url) !== "/v1/compare") {
    return false;
  }

  return (
    url.searchParams.get("baseRunId") === baseRunId && url.searchParams.get("targetRunId") === targetRunId
  );
}

export function matchesCompareExplainGet(url: URL, baseRunId: string, targetRunId: string): boolean {
  if (backendApiPath(url) !== "/v1/explain/compare/explain") {
    return false;
  }

  return (
    url.searchParams.get("baseRunId") === baseRunId && url.searchParams.get("targetRunId") === targetRunId
  );
}

/** Paged runs list (`GET /v1/authority/projects/{projectId}/reviews`) — query string varies (`page`/`pageSize` vs `cursor`/`take`). */
export function matchesAuthorityProjectRunsPagedGet(url: URL, projectId: string): boolean {
  return backendApiPath(url) === `/v1/authority/projects/${encodeURIComponent(projectId)}/reviews`;
}

/**
 * Scope-wide paged reviews (`GET /v1/authority/reviews`) — Compare {@link RunIdPicker} uses this when
 * `projectId` is `default` / omitted (`shouldListReviewsAcrossProjectSlugs`).
 */
export function matchesAuthorityReviewsInScopePagedGet(url: URL): boolean {
  return backendApiPath(url) === "/v1/authority/reviews";
}
