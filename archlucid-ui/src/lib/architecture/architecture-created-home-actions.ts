import { ARCHITECTURE_CREATED_PRIMARY_ACTIONS } from "@/lib/architecture/architecture-created-home-copy";
import { buildCreateHomeReviewTabHref } from "@/lib/unified-review-workspace-tabs";

import type { BuildArchitectureCreatedHomeModelInput } from "./architecture-created-home-summary";
import {
  buildMissingItems,
  partitionMissingItems,
  resolveClarifyHref,
  type ArchitectureMissingItem,
} from "./architecture-created-home-gaps";

export type ArchitectureCreatedPrimaryActionKind =
  | "continue-clarifying"
  | "generate-diagram"
  | "run-assessment"
  | "view-assessment-progress";

export type ArchitectureCreatedPrimaryAction = {
  readonly kind: ArchitectureCreatedPrimaryActionKind;
  readonly label: string;
  readonly href: string;
  readonly primary: boolean;
};

export function buildPrimaryActions(
  input: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreatedPrimaryAction[] {
  const clarifyHref = resolveClarifyHref(input);
  const diagramHref = buildCreateHomeReviewTabHref(input.runId, "diagram");
  const assessmentHref = buildCreateHomeReviewTabHref(input.runId, "activity");
  const partitioned = partitionMissingItems(buildMissingItems(input));
  const hasClarificationGaps = partitioned.clarificationGaps.length > 0;

  if (hasClarificationGaps) {
    return [
      {
        kind: "continue-clarifying",
        label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.continueClarifying,
        href: clarifyHref,
        primary: true,
      },
      {
        kind: "generate-diagram",
        label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.generateDiagram,
        href: diagramHref,
        primary: false,
      },
      {
        kind: input.assessmentInProgress ? "view-assessment-progress" : "run-assessment",
        label: input.assessmentInProgress
          ? ARCHITECTURE_CREATED_PRIMARY_ACTIONS.viewAssessmentProgress
          : ARCHITECTURE_CREATED_PRIMARY_ACTIONS.runAssessment,
        href: assessmentHref,
        primary: false,
      },
    ];
  }

  if (input.assessmentInProgress) {
    return [
      {
        kind: "view-assessment-progress",
        label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.viewAssessmentProgress,
        href: assessmentHref,
        primary: true,
      },
      {
        kind: "continue-clarifying",
        label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.continueClarifying,
        href: clarifyHref,
        primary: false,
      },
      {
        kind: "generate-diagram",
        label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.generateDiagram,
        href: diagramHref,
        primary: false,
      },
    ];
  }

  return [
    {
      kind: "run-assessment",
      label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.runAssessment,
      href: assessmentHref,
      primary: true,
    },
    {
      kind: "continue-clarifying",
      label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.continueClarifying,
      href: clarifyHref,
      primary: false,
    },
    {
      kind: "generate-diagram",
      label: ARCHITECTURE_CREATED_PRIMARY_ACTIONS.generateDiagram,
      href: diagramHref,
      primary: false,
    },
  ];
}

export function buildOverflowActions(
  runId: string,
): readonly { readonly label: string; readonly href: string }[] {
  return [
    { label: "View assessment details", href: buildCreateHomeReviewTabHref(runId, "findings") },
    { label: "Architecture diagram", href: buildCreateHomeReviewTabHref(runId, "diagram") },
    { label: "Add evidence", href: buildCreateHomeReviewTabHref(runId, "evidence") },
    { label: "Submitted architecture", href: buildCreateHomeReviewTabHref(runId, "overview") },
  ];
}

export type { ArchitectureMissingItem };
