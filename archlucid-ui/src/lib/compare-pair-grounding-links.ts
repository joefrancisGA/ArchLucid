import {
  buyerAskGroundingLinksForRun,
  type BuyerAskGroundingLink,
  type BuyerAskGroundingLinksForRunOptions,
} from "@/lib/ask-buyer-grounding-links";
import type { CompareFindingLifecycleRecord } from "@/lib/compare-finding-lifecycle";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";

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
