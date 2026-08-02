import { buyerAskGroundingLinksForRun, type BuyerAskGroundingLink } from "@/lib/ask-buyer-grounding-links";
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

function sideGrounding(
  runIdRaw: string,
  sideLabel: "Baseline" | "Updated",
): ComparePairSideGrounding | null {
  const runId = canonicalizeDemoRunId(runIdRaw.trim());

  if (runId.length === 0) {
    return null;
  }

  const links = buyerAskGroundingLinksForRun(runId);

  if (links === null || links.length === 0) {
    return null;
  }

  return { runId, sideLabel, links };
}

/** Pair-scoped Sources for compare — baseline and updated each get review / evidence / audit cites. */
export function comparePairGroundingForRuns(
  baselineRunId: string,
  updatedRunId: string,
): ComparePairGrounding {
  return {
    baseline: sideGrounding(baselineRunId, "Baseline"),
    updated: sideGrounding(updatedRunId, "Updated"),
  };
}

export function comparePairGroundingHasLinks(grounding: ComparePairGrounding): boolean {
  return grounding.baseline !== null || grounding.updated !== null;
}
