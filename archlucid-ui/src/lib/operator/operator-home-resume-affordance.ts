import { summarizeUnfinishedWorkRailItems } from "@/lib/unfinished-work-rail";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import type { IncompleteWizardSignal } from "@/lib/unfinished-work-rail";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
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
  readonly continueLastKind: "architecture" | "review" | null;
};

export type ResolveOperatorHomeResumeAffordanceInput = {
  readonly runs: readonly RunSummary[];
  readonly drafts: readonly ArchitectureDraftRegistryEntry[];
  readonly incompleteWizards: readonly IncompleteWizardSignal[];
  readonly workingMode?: boolean;
};

/** Collapse duplicate resume affordances — one filled primary on home (CA-37). */
export function resolveOperatorHomeResumeAffordancePlan(
  input: ResolveOperatorHomeResumeAffordanceInput,
): OperatorHomeResumeAffordancePlan {
  const architectureTarget =
    input.workingMode === true ? resolveContinueLastArchitectureIdentityTarget() : null;
  const reviewTarget = resolveContinueLastReviewPackageTarget(input.runs);
  const continueTarget = architectureTarget ?? reviewTarget;
  const continueLastKind =
    architectureTarget !== null ? "architecture" : reviewTarget !== null ? "review" : null;

  const railSummary = summarizeUnfinishedWorkRailItems({
    drafts: input.drafts,
    runs: input.runs,
    incompleteWizards: input.incompleteWizards,
  });

  if (continueTarget === null || continueLastKind === null) {
    return { showContinueLast: false, continueLastVariant: "outline", continueLastKind: null };
  }

  if (continueLastKind === "review") {
    const railSurfacesSameRun = railSummary.items.some((item) => {
      const runId = runIdFromReviewHref(item.href);

      return runId !== null && runId === reviewTarget?.runId;
    });

    if (railSurfacesSameRun) {
      return { showContinueLast: false, continueLastVariant: "outline", continueLastKind: null };
    }
  }

  if (railSummary.items.length > 0) {
    return { showContinueLast: true, continueLastVariant: "outline", continueLastKind };
  }

  return { showContinueLast: true, continueLastVariant: "primary", continueLastKind };
}
