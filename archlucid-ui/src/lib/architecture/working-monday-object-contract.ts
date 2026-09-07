import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  architectureIdentityPath,
  architectureNestedAskPath,
} from "@/lib/architecture/architecture-routes";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

/** ADR 0079 — falsifiable Monday-morning contract for the Working seat (SY-03). */
export const WORKING_MONDAY_OBJECT_ADR_ID = "0079" as const;

/**
 * Monday-morning failures this wave closes (Working seat only; Guided is exempt):
 *
 * 1. Start / Alt+N / last-open href is `/architecture/reviews` or `/architecture/reviews/{id}`.
 * 2. Global `SHORTCUTS` `alt+r` route is `REVIEWS_LIST_PATH` without a Working resolver.
 * 3. Global `alt+c` / `alt+a` / `alt+y` routes are bare `/insights/*` with no architecture nest helper.
 * 4. Working Home primary CTA imports `reviewDetailPath` or peer `startReviewFromArchitectureHref`.
 * 5. Nested tool builders (`architectureNestedAskPath`, etc.) are missing after SY-36+.
 */
export const WORKING_MONDAY_OBJECT_FAILURE_IDS = [
  "start-or-last-open-is-reviews-hub-or-peer-review",
  "alt-r-is-reviews-hub-without-working-resolver",
  "insights-shortcuts-are-bare-peer-products",
  "working-home-primary-imports-peer-review-mint",
  "nested-tool-path-helpers-missing",
] as const;

export type WorkingMondayObjectFailureId = (typeof WORKING_MONDAY_OBJECT_FAILURE_IDS)[number];

export type WorkingMondayObjectContract = {
  readonly adrId: typeof WORKING_MONDAY_OBJECT_ADR_ID;
  readonly failureIds: readonly WorkingMondayObjectFailureId[];
  readonly nestedToolHelperNames: readonly string[];
  readonly forbiddenWorkingStartPrefixes: readonly string[];
};

export const WORKING_MONDAY_OBJECT_CONTRACT: WorkingMondayObjectContract = {
  adrId: WORKING_MONDAY_OBJECT_ADR_ID,
  failureIds: WORKING_MONDAY_OBJECT_FAILURE_IDS,
  nestedToolHelperNames: [
    "architectureNestedAskPath",
    "architectureNestedComparePath",
    "architectureNestedGraphPath",
    "architectureNestedSearchPath",
    "architectureNestedFindingsPath",
  ],
  forbiddenWorkingStartPrefixes: [REVIEWS_LIST_PATH],
};

export { architectureNestedAskPath };

/** Nested Compare — implemented in SY-38; stub returns null until route lands. */
export function architectureNestedComparePath(architectureId: string | null | undefined): string | null {
  const trimmed = architectureId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `${architectureIdentityPath(trimmed)}/compare`;
}

/** Nested Graph — implemented in SY-40; stub returns null until route lands. */
export function architectureNestedGraphPath(architectureId: string | null | undefined): string | null {
  const trimmed = architectureId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `${architectureIdentityPath(trimmed)}/graph`;
}

/** Nested Search — implemented in SY-42; stub returns null until route lands. */
export function architectureNestedSearchPath(architectureId: string | null | undefined): string | null {
  const trimmed = architectureId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `${architectureIdentityPath(trimmed)}/search`;
}

/** Nested Findings — implemented in SY-43; stub returns null until route lands. */
export function architectureNestedFindingsPath(architectureId: string | null | undefined): string | null {
  const trimmed = architectureId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `${architectureIdentityPath(trimmed)}/findings`;
}

export const WORKING_PEER_INSIGHTS_TOOL_PATHS = {
  ask: ASK_REVIEW_QUESTIONS_PATH,
  compare: COMPARE_TWO_REVIEWS_PATH,
  graph: EVIDENCE_GRAPH_PATH,
} as const;

/** Portfolio fallback when Working has no open architecture for desk-first navigation (SY-07). */
export const WORKING_DESK_PORTFOLIO_HREF = ARCHITECTURES_LIST_PATH;
