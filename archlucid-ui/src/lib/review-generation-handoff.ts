import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";
import { writeOperatorScopeCookieFromHeaders } from "@/lib/operator/operator-scope-cookie";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";

/** Query key signaling app-initiated navigation immediately after review generation. */
export const FROM_GENERATION_QUERY_KEY = "fromGeneration";

/** Buyer-safe run-detail heading when a post-generation package cannot be opened yet. */
export const REVIEW_PACKAGE_OPEN_FAILURE_HEADING =
  "Architecture review — package could not be opened";

const STORAGE_PREFIX = "archlucid_review_generation_handoff_v1_";

export type ReviewGenerationHandoffSource =
  | "quick-review"
  | "socratic-intake"
  | "create-architecture"
  | "wizard-track"
  | "full-wizard"
  | "quick-start"
  | "simplified-pilot"
  | "unknown";

export type ReviewGenerationHandoffRecord = {
  runId: string;
  recordedAtUtc: string;
  workspaceId: string | null;
  projectId: string | null;
  tenantId: string | null;
  jobId: string | null;
  source: ReviewGenerationHandoffSource;
};

function storageKey(runId: string): string {
  return `${STORAGE_PREFIX}${runId.trim()}`;
}

/** Persists handoff context for diagnostics on the review detail route (browser session only). */
export function recordReviewGenerationHandoff(
  runId: string,
  source: ReviewGenerationHandoffSource,
  extras?: { readonly jobId?: string | null },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
  writeOperatorScopeCookieFromHeaders(scopeHeaders);
  const record: ReviewGenerationHandoffRecord = {
    runId: trimmedRunId,
    recordedAtUtc: new Date().toISOString(),
    workspaceId: scopeHeaders["x-workspace-id"]?.trim() ?? null,
    projectId: scopeHeaders["x-project-id"]?.trim() ?? null,
    tenantId: scopeHeaders["x-tenant-id"]?.trim() ?? null,
    jobId: extras?.jobId?.trim() ?? null,
    source,
  };

  try {
    window.sessionStorage.setItem(storageKey(trimmedRunId), JSON.stringify(record));
  } catch {
    /* private mode / quota */
  }
}

/** Reads handoff context recorded during generation redirect, if any. */
export function readReviewGenerationHandoff(runId: string): ReviewGenerationHandoffRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey(trimmedRunId));

    if (raw === null || raw.length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object" || !("runId" in parsed)) {
      return null;
    }

    const row = parsed as Record<string, unknown>;

    return {
      runId: String(row.runId ?? trimmedRunId),
      recordedAtUtc: String(row.recordedAtUtc ?? ""),
      workspaceId: row.workspaceId === null || row.workspaceId === undefined ? null : String(row.workspaceId),
      projectId: row.projectId === null || row.projectId === undefined ? null : String(row.projectId),
      tenantId: row.tenantId === null || row.tenantId === undefined ? null : String(row.tenantId),
      jobId: row.jobId === null || row.jobId === undefined ? null : String(row.jobId),
      source: isReviewGenerationHandoffSource(row.source) ? row.source : "unknown",
    };
  } catch {
    return null;
  }
}

export function clearReviewGenerationHandoff(runId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey(trimmedRunId));
  } catch {
    /* ignore */
  }
}

function isReviewGenerationHandoffSource(value: unknown): value is ReviewGenerationHandoffSource {
  return (
    value === "quick-review" ||
    value === "socratic-intake" ||
    value === "create-architecture" ||
    value === "wizard-track" ||
    value === "full-wizard" ||
    value === "quick-start" ||
    value === "simplified-pilot" ||
    value === "unknown"
  );
}

/** True when the URL carries the post-generation handoff query flag. */
export function isFromGenerationSearchParam(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;

  return raw === "1" || raw === "true";
}

/**
 * Review detail href after create/generate. App Router has no location state — the query flag plus sessionStorage
 * handoff record are the source of truth for post-generation failure UX.
 */
export function reviewDetailHrefAfterGeneration(
  runId: string,
  options?: { readonly architectureCreation?: boolean },
): string {
  const trimmedRunId = runId.trim();
  const qs = new URLSearchParams();

  qs.set(FROM_GENERATION_QUERY_KEY, "1");

  if (options?.architectureCreation === true) {
    qs.set("intent", CREATE_ARCHITECTURE_INTENT);
  }

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?${qs.toString()}`;
}

/** Records handoff context then returns the generation redirect href (for router.push or Link href). */
export function buildReviewGenerationRedirect(
  runId: string,
  source: ReviewGenerationHandoffSource,
  extras?: { readonly jobId?: string | null; readonly architectureCreation?: boolean },
): string {
  recordReviewGenerationHandoff(runId, source, extras);

  return reviewDetailHrefAfterGeneration(runId, {
    architectureCreation: extras?.architectureCreation === true,
  });
}
