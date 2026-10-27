import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM,
  resolveFinalizeSuccessDeskHref,
} from "@/lib/architecture/finalize-success-desk-href";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_PORTFOLIO_RESUME_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export type SystemNotJobWorkingResumeReviewHrefInput = {
  readonly runId: string;
  readonly requestId?: string | null;
  readonly architectureId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
  readonly workingMode?: boolean;
};

/** Parses run id from peer or nested architecture review job URLs (SN-012). */
export function resolveRunIdFromWorkingReviewHref(href: string): string | null {
  const [pathPart, queryPart = ""] = href.split("?");
  const path = pathPart ?? "";

  const nestedMatch = /^\/architecture\/architectures\/[^/]+\/reviews\/([^/?#]+)/.exec(path);

  if (nestedMatch !== null) {
    try {
      const runId = decodeURIComponent(nestedMatch[1]).trim();

      return runId.length > 0 ? runId : null;
    } catch {
      return null;
    }
  }

  const peerMatch = /^\/architecture\/reviews\/([^/?#]+)/.exec(path);

  if (peerMatch !== null) {
    try {
      const runId = decodeURIComponent(peerMatch[1]).trim();

      if (runId.length === 0 || runId === "new" || runId.includes("/")) {
        return null;
      }

      return runId;
    } catch {
      return null;
    }
  }

  const architectureDeskMatch = /^\/architecture\/architectures\/([^/?#]+)/.exec(path);

  if (architectureDeskMatch !== null && queryPart.trim().length > 0) {
    const highlightReviewId =
      new URLSearchParams(queryPart).get(FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM)?.trim() ?? "";

    if (highlightReviewId.length > 0 && highlightReviewId !== "new" && !highlightReviewId.includes("/")) {
      return highlightReviewId;
    }
  }

  return null;
}

/** SN-012 / SG-040: Working resume lands on the architecture desk when parent id is known; honest peer fallback otherwise. */
export function resolveSystemNotJobWorkingResumeReviewHref(
  input: SystemNotJobWorkingResumeReviewHrefInput,
): string {
  const runId = input.runId.trim();

  if (input.workingMode !== true) {
    return reviewDetailPath(runId);
  }

  const locator = resolveWorkingRunReviewLocator({
    runId,
    requestId: input.requestId,
    architectureId: input.architectureId,
    draftRegistryEntries: input.draftRegistryEntries,
  });

  if (locator.architectureId !== null) {
    return resolveFinalizeSuccessDeskHref(locator.architectureId, runId);
  }

  return locator.href;
}
