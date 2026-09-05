import { summarizeUnfinishedWorkRailItems } from "@/lib/unfinished-work-rail";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import type { IncompleteWizardSignal } from "@/lib/unfinished-work-rail";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import type { RunSummary } from "@/types/authority";

const REVIEW_PATH_PREFIX = "/architecture/reviews/";

function runIdFromReviewHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(REVIEW_PATH_PREFIX)) {
    return null;
  }

  const remainder = path.slice(REVIEW_PATH_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

export type OperatorHomeResumeAffordancePlan = {
  readonly showContinueLast: boolean;
  readonly continueLastVariant: "primary" | "outline";
};

export type ResolveOperatorHomeResumeAffordanceInput = {
  readonly runs: readonly RunSummary[];
  readonly drafts: readonly ArchitectureDraftRegistryEntry[];
  readonly incompleteWizards: readonly IncompleteWizardSignal[];
};

/** Collapse duplicate resume affordances — one filled primary on home. */
export function resolveOperatorHomeResumeAffordancePlan(
  input: ResolveOperatorHomeResumeAffordanceInput,
): OperatorHomeResumeAffordancePlan {
  const continueTarget = resolveContinueLastReviewPackageTarget(input.runs);
  const railSummary = summarizeUnfinishedWorkRailItems({
    drafts: input.drafts,
    runs: input.runs,
    incompleteWizards: input.incompleteWizards,
  });

  if (continueTarget === null) {
    return { showContinueLast: false, continueLastVariant: "outline" };
  }

  const railSurfacesSameRun = railSummary.items.some((item) => {
    const runId = runIdFromReviewHref(item.href);

    return runId !== null && runId === continueTarget.runId;
  });

  if (railSurfacesSameRun) {
    return { showContinueLast: false, continueLastVariant: "outline" };
  }

  if (railSummary.items.length > 0) {
    return { showContinueLast: true, continueLastVariant: "outline" };
  }

  return { showContinueLast: true, continueLastVariant: "primary" };
}
