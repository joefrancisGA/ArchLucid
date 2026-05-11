import type { RunSummary } from "@/types/authority";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/**
 * Maps legacy bookmark/demo URLs to the canonical showcase run id so list pickers, run detail, and static
 * payloads agree (see OpenAI UI review 2026-04-30 — route/data-key mismatch).
 */
const DEMO_RUN_ID_ALIASES: Readonly<Record<string, string>> = {
  "claims-intake-modernization-run": SHOWCASE_STATIC_DEMO_RUN_ID,
  /** Workspace/sample bookmark tokens that still appear in docs and screenshots — normalize to canonical showcase id. */
  "claims-intake-sample-workspace": SHOWCASE_STATIC_DEMO_RUN_ID,
  /** Mock Ask conversation fixtures historically used this token — align pickers with the showcase review id. */
  "run-claims-intake-demo": SHOWCASE_STATIC_DEMO_RUN_ID,
};

/**
 * Canonical showcase id plus every legacy alias key — used for buyer-facing labels before trusting API display text.
 */
export const SHOWCASE_DEMO_RUN_SLUG_KEYS: ReadonlySet<string> = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  ...Object.keys(DEMO_RUN_ID_ALIASES),
]);

/** Returns the canonical run id when `runId` is a known demo alias; otherwise returns trimmed `runId`. */
export function canonicalizeDemoRunId(runId: string): string {
  const t = runId.trim();

  if (t.length === 0) {
    return t;
  }

  return DEMO_RUN_ID_ALIASES[t] ?? t;
}

/** True when `runId` is the canonical Claims Intake showcase slug or a legacy bookmark/API alias for it. */
export function isShowcaseStaticDemoRunId(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (SHOWCASE_DEMO_RUN_SLUG_KEYS.has(trimmed)) {
    return true;
  }

  return canonicalizeDemoRunId(trimmed) === SHOWCASE_STATIC_DEMO_RUN_ID;
}

/** True when visiting `/runs/{runId}` (or executive `/reviews/{runId}`) should 308 to the canonical id. */
export function demoRunUrlRequiresCanonicalRedirect(runId: string): boolean {
  const t = runId.trim();
  const canon = canonicalizeDemoRunId(t);

  return canon.length > 0 && canon !== t;
}

/** Normalize API rows that still use a legacy demo id so pickers match static list payloads. */
export function normalizeRunSummaryForDemoPicker(row: RunSummary): RunSummary {
  const canon = canonicalizeDemoRunId(row.runId);

  if (canon === row.runId) {
    return row;
  }

  return { ...row, runId: canon };
}
