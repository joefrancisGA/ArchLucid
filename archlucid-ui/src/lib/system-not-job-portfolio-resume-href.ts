import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
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
  const path = href.split("?")[0] ?? "";

  const nestedMatch = /^\/architecture\/architectures\/[^/]+\/reviews\/([^/?#]+)/.exec(path);

  if (nestedMatch !== null) {
    const runId = decodeURIComponent(nestedMatch[1]).trim();

    return runId.length > 0 ? runId : null;
  }

  const peerMatch = /^\/architecture\/reviews\/([^/?#]+)/.exec(path);

  if (peerMatch === null) {
    return null;
  }

  const runId = decodeURIComponent(peerMatch[1]).trim();

  if (runId.length === 0 || runId === "new" || runId.includes("/")) {
    return null;
  }

  return runId;
}

/** SN-012: Working resume opens nested review jobs when architecture id is known; honest peer fallback otherwise. */
export function resolveSystemNotJobWorkingResumeReviewHref(
  input: SystemNotJobWorkingResumeReviewHrefInput,
): string {
  const runId = input.runId.trim();

  if (input.workingMode !== true) {
    return reviewDetailPath(runId);
  }

  return resolveWorkingRunReviewLocator({
    runId,
    requestId: input.requestId,
    architectureId: input.architectureId,
    draftRegistryEntries: input.draftRegistryEntries,
  }).href;
}
