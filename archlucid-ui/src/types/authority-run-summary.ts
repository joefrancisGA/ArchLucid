import type { components } from "@/lib/openapi-schemas";

/**
 * Intentional UI-only list enrichments merged onto OpenAPI `RunSummaryResponse` after fetch.
 *
 * Wave 9: **not** an OpenAPI alias — no `RunSummaryWireExtensions` schema exists. Keys are sporadic
 * list/detail merges the shell treats as present after fetch; document new extensions here instead of
 * widening `RunSummaryResponse` in hand-authored DTOs.
 */
export type RunSummaryWireExtensions = {
  /** Golden manifest id when list/summary already resolved it (avoids N× getRunDetail). */
  goldenManifestId?: string | null;
  /** Manifest rule-set version when list endpoints already resolved it (avoids N× getManifestSummary). */
  currentManifestVersion?: string | null;
  findingCount?: number | null;
  warningCount?: number | null;
  artifactCount?: number | null;
  /** INV-002 persisted structural execution mode when merged from run detail. */
  structuralExecutionMode?: components["schemas"]["StructuralExecutionMode"] | number | null;
  /** Architecture request id when returned by list/detail endpoints (used for restore from archive). */
  requestId?: string | null;
  /** Creator identity when returned by list/detail endpoints. */
  createdByUserId?: string | null;
  /** When true, the backing architecture request is archived and hidden from default lists. */
  isArchived?: boolean | null;
  /** When true, the run was created via an idempotency replay. */
  idempotencyReplayed?: boolean | null;
  /** When true, pipeline delivery failed permanently for this run. */
  isDeadLettered?: boolean | null;
  /** Authority pipeline lifecycle phase when list endpoints return it (wave-6/7). */
  authorityLifecyclePhase?: components["schemas"]["AuthorityRunLifecyclePhase"] | null;
  /** Package origin for list badges (`Created` | `Reviewed`). */
  packageOrigin?: string | null;
  /** Synthetic Overview sample row for demo/seeded empty home (TB-1039) — not real tenant activity. */
  demoSeededOverviewInject?: boolean | null;
  /** Detail merge: pipeline re-attempt count when run detail is projected onto summary props. */
  retryCount?: number | null;
  /** Detail merge: creation-span OTel trace id from `RunRecord` when run detail is projected onto summary props. */
  otelTraceId?: string | null;
  /** List/detail merge: finalization timestamp when the API returns it for ordering committed runs. */
  completedUtc?: string | null;
  /** List/detail merge: coordinator legacy status for terminal execute badge honesty (DR-06). */
  legacyRunStatus?: string | null;
  /** List/detail merge: last-modified timestamp when the API returns it for recency ordering. */
  lastModifiedUtc?: string | null;
};

/**
 * Lightweight summary — **OpenAPI** `RunSummaryResponse` plus sporadic list keys the shell treats as present after fetch.
 */
export type RunSummary = components["schemas"]["RunSummaryResponse"] &
  RunSummaryWireExtensions & {
    runId: string;
    projectId: string;
    createdUtc: string;
  };
