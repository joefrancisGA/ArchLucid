import { summarizeUnfinishedWorkRailItems } from "@/lib/unfinished-work-rail";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import type { IncompleteWizardSignal } from "@/lib/unfinished-work-rail";
import { resolveContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import {
  collectResumeRunIdsForMatch,
  resumeHrefsEquivalentForDedupe,
} from "@/lib/operator/operator-home-hero-resume-target";
import { resolveOperatorUnfinishedWorkRailItemResumeTarget } from "@/lib/operator/operator-unfinished-work-rail-resume-target";
import type { RunSummary } from "@/types/authority";

function architectureDeskIdFromHref(href: string): string | null {
  const path = (href.split("?")[0] ?? "").replace(/\/+$/, "");
  const match = /^\/architecture\/architectures\/([^/?#]+)/.exec(path);

  if (match === null) {
    return null;
  }

  try {
    const architectureId = decodeURIComponent(match[1]).trim();

    if (architectureId.length === 0 || architectureId === "new" || architectureId.includes("/")) {
      return null;
    }

    return architectureId;
  } catch {
    return null;
  }
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
  const reviewTarget = resolveContinueLastReviewPackageTarget(input.runs, undefined, {
    workingMode: input.workingMode === true,
    draftRegistryEntries: input.drafts,
  });
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

  if (continueLastKind === "architecture" && architectureTarget !== null) {
    const targetArchitectureId = architectureTarget.architectureId.trim();

    const railSurfacesSameArchitecture = railSummary.items.some((item) => {
      const targetHref = architectureTarget.href.trim();

      if (targetHref.length > 0 && resumeHrefsEquivalentForDedupe(item.href, targetHref)) {
        return true;
      }

      if (targetArchitectureId.length === 0) {
        return false;
      }

      const draftIdFromRailId = item.id.startsWith("architecture-draft:")
        ? item.id.slice("architecture-draft:".length).trim()
        : "";

      if (draftIdFromRailId.length > 0 && draftIdFromRailId === targetArchitectureId) {
        return true;
      }

      const architectureIdFromRailHref = architectureDeskIdFromHref(item.href);

      if (
        architectureIdFromRailHref !== null
        && architectureIdFromRailHref === targetArchitectureId
      ) {
        return true;
      }

      return false;
    });

    if (railSurfacesSameArchitecture) {
      return { showContinueLast: false, continueLastVariant: "outline", continueLastKind: null };
    }
  }

  if (continueLastKind === "review") {
    const railSurfacesSameRun = railSummary.items.some((item) => {
      const targetHref = reviewTarget?.href?.trim() ?? "";

      if (targetHref.length === 0) {
        return false;
      }

      const targetRunIds = collectResumeRunIdsForMatch(targetHref, reviewTarget?.runId);
      const railResume = resolveOperatorUnfinishedWorkRailItemResumeTarget(item);
      const railRunIds = collectResumeRunIdsForMatch(railResume.href, railResume.runId);

      if (railRunIds.some((railRunId) => targetRunIds.includes(railRunId))) {
        return true;
      }

      return resumeHrefsEquivalentForDedupe(item.href, targetHref);
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
