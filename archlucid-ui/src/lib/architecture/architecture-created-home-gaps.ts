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
const MAX_MISSING_ITEMS = 5;

function buildGapSource(input: BuildArchitectureCreatedHomeModelInput): ClarificationGapSource {
  return buildClarificationGapSourcePresentation({
    capturedAtUtc: input.gapSourceCapturedAtUtc,
    fromHandoff: input.gapSourceCapturedAtUtc !== null,
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
  const source = buildGapSource(input);

  if (input.gapAssertion.businessOutcome && input.businessOutcome.trim().length < MIN_OUTCOME_CHARS) {
    items.push({
      id: "business-outcome",
      label: "Business outcome is still brief or missing",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  if (input.architectureOverview.trim().length < MIN_STRONG_OVERVIEW_CHARS) {
    items.push({
      id: "architecture-overview",
      label: "Architecture overview needs more system context",
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
      label: "People, systems, or integrations are not identified yet",
      href: clarifyHref,
      category: "clarification",
      source,
    });
  }

  if (!input.hasArtifacts) {
    items.push({
      id: "diagram",
      label: "Architecture diagram or supporting evidence not uploaded",
      href: buildCreateHomeReviewTabHref(input.runId, "evidence"),
      category: "evidence",
      source,
    });
  }

  if (input.assessmentInProgress) {
    items.push({
      id: "assessment-progress",
      label: "Initial assessment is still running",
      href: buildCreateHomeReviewTabHref(input.runId, "activity"),
      category: "assessment",
      source,
    });
  }

  return items.slice(0, MAX_MISSING_ITEMS);
}

export function buildMissingItems(input: BuildArchitectureCreatedHomeModelInput): ArchitectureMissingItem[] {
  const findingsQuestions = input.findingsDerivedQuestions ?? [];

  if (findingsQuestions.length > 0) {
    return buildFindingsDerivedClarificationGaps({
      runId: input.runId,
      questions: findingsQuestions,
      clarificationPriorRunId: input.clarificationPriorRunId ?? input.runId,
      gapSourceCapturedAtUtc: input.gapSourceCapturedAtUtc,
    }).slice(0, MAX_MISSING_ITEMS);
  }

  return buildHeuristicMissingItems(input);
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
