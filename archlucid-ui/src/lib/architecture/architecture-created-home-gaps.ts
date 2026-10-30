import { UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import { buildClarificationGapSourcePresentation } from "@/lib/architecture/architecture-clarification-gap-present";
import { buildFindingsDerivedClarificationGaps } from "@/lib/architecture/build-findings-derived-clarification-gaps";
import { resolveClarificationFollowUpHref } from "@/lib/architecture/resolve-clarification-follow-up-href";
import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import { buildCreateHomeReviewTabHref } from "@/lib/unified-review-workspace-tabs";

import type { BuildArchitectureCreatedHomeModelInput } from "./architecture-created-home-summary";

export type ClarificationGapCategory = "clarification" | "evidence" | "assessment";

export type ClarificationGapSource = {
  readonly label: string;
  readonly capturedAtLabel: string | null;
};

export type ArchitectureMissingItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly category: ClarificationGapCategory;
  readonly source: ClarificationGapSource;
};

const MIN_STRONG_OVERVIEW_CHARS = 100;
const MIN_OUTCOME_CHARS = 10;
const MAX_MISSING_ITEMS = 6;

function capMissingItems(items: readonly ArchitectureMissingItem[]): {
  readonly items: readonly ArchitectureMissingItem[];
  readonly omittedCount: number;
} {
  if (items.length <= MAX_MISSING_ITEMS) {
    return { items, omittedCount: 0 };
  }

  return {
    items: items.slice(0, MAX_MISSING_ITEMS),
    omittedCount: items.length - MAX_MISSING_ITEMS,
  };
}

function buildGapSource(
  input: BuildArchitectureCreatedHomeModelInput,
  options?: { readonly heuristicDerived?: boolean },
): ClarificationGapSource {
  return buildClarificationGapSourcePresentation({
    capturedAtUtc: input.gapSourceCapturedAtUtc,
    fromHandoff: input.gapSourceCapturedAtUtc !== null,
    heuristicDerived: options?.heuristicDerived === true,
  });
}

function resolveClarifyHref(input: BuildArchitectureCreatedHomeModelInput): string {
  if (input.clarificationRoundAvailable === true) {
    return resolveClarificationFollowUpHref({
      runId: input.runId,
      priorRunId: input.clarificationPriorRunId ?? input.runId,
    });
  }

  return buildArchitectureCorrectionHref(input.runId, input.correctionHref);
}

function buildHeuristicMissingItems(input: BuildArchitectureCreatedHomeModelInput): ArchitectureMissingItem[] {
  const items: ArchitectureMissingItem[] = [];
  const clarifyHref = resolveClarifyHref(input);
  const source = buildGapSource(input, { heuristicDerived: true });

  const normalizedArchitectureName = input.architectureName.trim();

  if (
    normalizedArchitectureName.length === 0
    || normalizedArchitectureName.toLowerCase() === "untitled architecture"
    || normalizedArchitectureName === UNTITLED_ARCHITECTURE_LABEL
  ) {
    items.push({
      id: "system-name",
      label: "System name not stored or below intake minimum on this page",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  if (input.gapAssertion.businessOutcome && input.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    items.push({
      id: "business-outcome",
      label: "Business outcome not stored or below intake minimum on this page",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  if (input.architectureOverview.trim().length < MIN_STRONG_OVERVIEW_CHARS) {
    items.push({
      id: "architecture-overview",
      label: "Architecture overview not stored or below intake minimum on this page",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  if (
    input.gapAssertion.peopleAndSystems &&
    input.peopleAndSystems.length === 0 &&
    (input.architectureName.trim().length === 0 ||
      input.architectureName.trim().toLowerCase() === "untitled architecture")
  ) {
    items.push({
      id: "people-systems",
      label: "People and systems not listed on this page yet",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  const artifactBundleKnown = input.artifactBundleKnown !== false;

  if (artifactBundleKnown && !input.hasArtifacts) {
    items.push({
      id: "diagram",
      label: "No diagram or evidence artifact listed on this review yet",
      href: buildCreateHomeReviewTabHref(input.runId, "evidence"),
      category: "evidence",
      source,
    });
  }

  if (input.assessmentInProgress) {
    items.push({
      id: "assessment-progress",
      label: "Assessment run is in progress on this review",
      href: buildCreateHomeReviewTabHref(input.runId, "activity"),
      category: "assessment",
      source,
    });
  }

  return items;
}

export function buildMissingItems(input: BuildArchitectureCreatedHomeModelInput): ArchitectureMissingItem[] {
  return [...buildMissingItemsWithOmitted(input).items];
}

export function buildMissingItemsWithOmitted(input: BuildArchitectureCreatedHomeModelInput): {
  readonly items: readonly ArchitectureMissingItem[];
  readonly omittedCount: number;
} {
  const findingsQuestions = input.findingsDerivedQuestions ?? [];

  if (findingsQuestions.length > 0) {
    return capMissingItems(
      buildFindingsDerivedClarificationGaps({
        runId: input.runId,
        questions: findingsQuestions,
        clarificationPriorRunId: input.clarificationPriorRunId ?? input.runId,
        gapSourceCapturedAtUtc: input.gapSourceCapturedAtUtc,
      }),
    );
  }

  return capMissingItems(buildHeuristicMissingItems(input));
}

export function partitionMissingItems(items: readonly ArchitectureMissingItem[]): {
  readonly clarificationGaps: readonly ArchitectureMissingItem[];
  readonly evidenceGaps: readonly ArchitectureMissingItem[];
  readonly assessmentItems: readonly ArchitectureMissingItem[];
} {
  return {
    clarificationGaps: items.filter((item) => item.category === "clarification"),
    evidenceGaps: items.filter((item) => item.category === "evidence"),
    assessmentItems: items.filter((item) => item.category === "assessment"),
  };
}

export { resolveClarifyHref };
