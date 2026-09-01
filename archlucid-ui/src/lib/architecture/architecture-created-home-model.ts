import { ARCHITECTURE_DEFINITION_STATUS_LABELS } from "@/lib/architecture/architecture-created-home-copy";
import type { ArchitectureCreationHandoffSnapshot } from "@/lib/architecture/architecture-creation-handoff";

import {
  buildOverflowActions,
  buildPrimaryActions,
  type ArchitectureCreatedPrimaryAction,
  type ArchitectureCreatedPrimaryActionKind,
} from "./architecture-created-home-actions";
import {
  buildMissingItems,
  partitionMissingItems,
  type ArchitectureMissingItem,
  type ClarificationGapCategory,
  type ClarificationGapSource,
} from "./architecture-created-home-gaps";
import {
  DEFAULT_GAP_ASSERTION,
  buildSummaryFields,
  deriveDefinitionStatus,
  type ArchitectureDefinitionStatusKind,
  type ArchitectureGapAssertionFlags,
  type ArchitectureSummaryField,
  type BuildArchitectureCreatedHomeModelInput,
} from "./architecture-created-home-summary";

export type {
  ArchitectureCreatedPrimaryAction,
  ArchitectureCreatedPrimaryActionKind,
  ArchitectureDefinitionStatusKind,
  ArchitectureGapAssertionFlags,
  ArchitectureMissingItem,
  ArchitectureSummaryField,
  BuildArchitectureCreatedHomeModelInput,
  ClarificationGapCategory,
  ClarificationGapSource,
};

export type ArchitectureCreatedHomeModel = {
  readonly runId: string;
  readonly architectureName: string;
  readonly lifecycleLabel: string;
  readonly lifecycleStatusTagKind: BuildArchitectureCreatedHomeModelInput["workspaceStatus"]["statusTagKind"];
  readonly ownerLabel: string | null;
  readonly lastUpdatedLabel: string;
  readonly definitionStatus: ArchitectureDefinitionStatusKind;
  readonly definitionStatusLabel: string;
  readonly summaryFields: readonly ArchitectureSummaryField[];
  readonly missingItems: readonly ArchitectureMissingItem[];
  readonly clarificationGaps: readonly ArchitectureMissingItem[];
  readonly evidenceGaps: readonly ArchitectureMissingItem[];
  readonly assessmentItems: readonly ArchitectureMissingItem[];
  readonly primaryActions: readonly ArchitectureCreatedPrimaryAction[];
  readonly overflowActions: readonly { readonly label: string; readonly href: string }[];
};

export function buildArchitectureCreatedHomeModel(
  input: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreatedHomeModel {
  const definitionStatus = deriveDefinitionStatus(input);
  const missingItems = buildMissingItems(input);
  const partitioned = partitionMissingItems(missingItems);

  return {
    runId: input.runId,
    architectureName: input.architectureName.trim().length > 0 ? input.architectureName.trim() : "Untitled architecture",
    lifecycleLabel: input.workspaceStatus.label === "Analysis in progress" ? "Assessment in progress" : input.workspaceStatus.label,
    lifecycleStatusTagKind: input.workspaceStatus.statusTagKind,
    ownerLabel: input.ownerLabel,
    lastUpdatedLabel: input.lastUpdatedLabel,
    definitionStatus,
    definitionStatusLabel: ARCHITECTURE_DEFINITION_STATUS_LABELS[definitionStatus],
    summaryFields: buildSummaryFields(input),
    missingItems,
    clarificationGaps: partitioned.clarificationGaps,
    evidenceGaps: partitioned.evidenceGaps,
    assessmentItems: partitioned.assessmentItems,
    primaryActions: buildPrimaryActions(input),
    overflowActions: buildOverflowActions(input.runId),
  };
}

export function mergeArchitectureCreatedHomeInput(
  baseline: BuildArchitectureCreatedHomeModelInput,
  snapshot: ArchitectureCreationHandoffSnapshot | null,
): BuildArchitectureCreatedHomeModelInput {
  if (snapshot === null) {
    return baseline;
  }

  return {
    ...baseline,
    architectureName:
      snapshot.architectureName.length > 0 ? snapshot.architectureName : baseline.architectureName,
    architectureOverview:
      snapshot.architectureOverview.length > 0 ? snapshot.architectureOverview : baseline.architectureOverview,
    businessOutcome:
      snapshot.businessOutcome.length > 0 ? snapshot.businessOutcome : baseline.businessOutcome,
    peopleAndSystems:
      snapshot.peopleAndSystems.length > 0 ? snapshot.peopleAndSystems : baseline.peopleAndSystems,
    gapAssertion: {
      businessOutcome: true,
      peopleAndSystems: true,
    },
    gapSourceCapturedAtUtc: snapshot.recordedAtUtc,
  };
}

export function withDefaultGapAssertionInput(
  input: Omit<BuildArchitectureCreatedHomeModelInput, "gapAssertion" | "gapSourceCapturedAtUtc" | "correctionHref"> &
    Partial<Pick<BuildArchitectureCreatedHomeModelInput, "gapAssertion" | "gapSourceCapturedAtUtc" | "correctionHref">>,
): BuildArchitectureCreatedHomeModelInput {
  return {
    ...input,
    correctionHref: input.correctionHref ?? null,
    gapAssertion: input.gapAssertion ?? DEFAULT_GAP_ASSERTION,
    gapSourceCapturedAtUtc: input.gapSourceCapturedAtUtc ?? null,
  };
}
