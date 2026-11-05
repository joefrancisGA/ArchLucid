import {
  buyerAskGroundingLinksForRun,
  resolveAskBuyerOpenReviewHref,
  type BuyerAskGroundingLink,
  type BuyerAskGroundingLinksForRunOptions,
} from "@/lib/ask-buyer-grounding-links";
import type { CompareFindingLifecycleRecord } from "@/lib/compare-finding-lifecycle";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { resolveSystemNotJobWorkingReviewOpenHref } from "@/lib/system-not-job-nested-review-job-mint";

export type ComparePairSideGrounding = {
  readonly runId: string;
  readonly sideLabel: "Baseline" | "Updated";
  readonly links: readonly BuyerAskGroundingLink[];
};

export type ComparePairGrounding = {
  readonly baseline: ComparePairSideGrounding | null;
  readonly updated: ComparePairSideGrounding | null;
};

export type ComparePairGroundingForRunsOptions = {
  readonly baselinePrimaryFindingId?: string | null;
  readonly updatedPrimaryFindingId?: string | null;
  readonly architectureId?: string | null;
};

function sideGrounding(
  runIdRaw: string,
  sideLabel: "Baseline" | "Updated",
  primaryFindingId?: string | null,
): ComparePairSideGrounding | null {
  const runId = canonicalizeDemoRunId(runIdRaw.trim());

  if (runId.length === 0) {
    return null;
  }

  const askOptions: BuyerAskGroundingLinksForRunOptions | undefined =
    primaryFindingId !== undefined && primaryFindingId !== null
      ? { primaryFindingId }
      : primaryFindingId === null
        ? { primaryFindingId: null }
        : undefined;

  const links = buyerAskGroundingLinksForRun(runId, askOptions);

  if (links === null || links.length === 0) {
    return null;
  }

  return { runId, sideLabel, links };
}

/** First correlated finding id on each side — used to ground Open review cites. */
export function resolveComparePairPrimaryFindingIds(
  lifecycleRecords: readonly CompareFindingLifecycleRecord[],
): ComparePairGroundingForRunsOptions {
  let baselinePrimaryFindingId: string | null = null;
  let updatedPrimaryFindingId: string | null = null;

  for (const record of lifecycleRecords) {
    const prior = record.priorFindingId?.trim() ?? "";
    const current = record.currentFindingId?.trim() ?? "";

    if (baselinePrimaryFindingId === null && prior.length > 0) {
      baselinePrimaryFindingId = prior;
    }

    if (updatedPrimaryFindingId === null && current.length > 0) {
      updatedPrimaryFindingId = current;
    }

    if (baselinePrimaryFindingId !== null && updatedPrimaryFindingId !== null) {
      break;
    }
  }

  return { baselinePrimaryFindingId, updatedPrimaryFindingId };
}

/** Compare scope banner Open updated review — aligned with cite-strip primary finding resolution. */
export function resolveCompareUpdatedReviewOpenHref(
  updatedRunId: string,
  architectureId: string | null | undefined,
  lifecycleRecords: readonly CompareFindingLifecycleRecord[],
): string {
  const trimmedUpdatedRunId = updatedRunId.trim();
  const fallbackHref = resolveSystemNotJobWorkingReviewOpenHref(trimmedUpdatedRunId, architectureId);

  if (trimmedUpdatedRunId.length === 0) {
    return fallbackHref;
  }

  const { updatedPrimaryFindingId } = resolveComparePairPrimaryFindingIds(lifecycleRecords);

  if (updatedPrimaryFindingId === null || updatedPrimaryFindingId.trim().length === 0) {
    return fallbackHref;
  }

  return resolveAskBuyerOpenReviewHref(trimmedUpdatedRunId, { primaryFindingId: updatedPrimaryFindingId });
}

/** Pair-scoped Sources for compare — baseline and updated each get review / evidence / audit cites. */
export function comparePairGroundingForRuns(
  baselineRunId: string,
  updatedRunId: string,
  options?: ComparePairGroundingForRunsOptions,
): ComparePairGrounding {
  return {
    baseline: sideGrounding(baselineRunId, "Baseline", options?.baselinePrimaryFindingId),
    updated: sideGrounding(updatedRunId, "Updated", options?.updatedPrimaryFindingId),
  };
}

export function comparePairGroundingHasLinks(grounding: ComparePairGrounding): boolean {
  return grounding.baseline !== null || grounding.updated !== null;
}
