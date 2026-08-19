import {
  ARCHITECTURE_CREATED_PRIMARY_ACTIONS,
  ARCHITECTURE_DEFINITION_STATUS_LABELS,
  ARCHITECTURE_SUMMARY_LABELS,
} from "@/lib/architecture/architecture-created-home-copy";
import { buildClarificationGapSourcePresentation } from "@/lib/architecture/architecture-clarification-gap-present";
import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import type { ArchitectureCreationHandoffSnapshot } from "@/lib/architecture/architecture-creation-handoff";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

export type ArchitectureDefinitionStatusKind =
  | "strong-foundation"
  | "needs-clarification"
  | "insufficient-context";

export type ArchitectureSummaryField = {
  readonly label: string;
  readonly value: string;
};

export type ClarificationGapCategory = "clarification" | "evidence" | "assessment";

export type ClarificationGapSource = {
  readonly label: string;
  readonly capturedAtLabel: string | null;
};

export type ArchitectureGapAssertionFlags = {
  readonly businessOutcome: boolean;
  readonly peopleAndSystems: boolean;
};

export type ArchitectureMissingItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly category: ClarificationGapCategory;
  readonly source: ClarificationGapSource;
};

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

export type ArchitectureCreatedHomeModel = {
  readonly runId: string;
  readonly architectureName: string;
  readonly lifecycleLabel: string;
  readonly lifecycleStatusTagKind: RunDetailWorkspaceStatus["statusTagKind"];
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

export type BuildArchitectureCreatedHomeModelInput = {
  readonly runId: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly businessOutcome: string;
  readonly peopleAndSystems: readonly { readonly label: string; readonly kind: string }[];
  readonly ownerLabel: string | null;
  readonly lastUpdatedLabel: string;
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly assessmentInProgress: boolean;
  readonly hasArtifacts: boolean;
  readonly correctionHref: string | null;
  readonly gapAssertion: ArchitectureGapAssertionFlags;
  readonly gapSourceCapturedAtUtc: string | null;
};

const MIN_STRONG_OVERVIEW_CHARS = 100;
const MIN_CLARIFICATION_OVERVIEW_CHARS = 40;
const MIN_OUTCOME_CHARS = 10;
const MAX_MISSING_ITEMS = 5;

const DEFAULT_GAP_ASSERTION: ArchitectureGapAssertionFlags = {
  businessOutcome: true,
  peopleAndSystems: true,
};

function firstSentence(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const match = /^[^.!?\n]+[.!?]?/.exec(trimmed);

  return (match?.[0] ?? trimmed).trim();
}

function truncateSummary(value: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function deriveDefinitionStatus(
  input: BuildArchitectureCreatedHomeModelInput,
): ArchitectureDefinitionStatusKind {
  const overviewLength = input.architectureOverview.trim().length;
  const hasOutcome = input.businessOutcome.trim().length >= MIN_OUTCOME_CHARS;
  const hasNamedSystem =
    input.architectureName.trim().length > 0 &&
    input.architectureName.trim().toLowerCase() !== "untitled architecture";
  const hasPeopleOrSystems = input.peopleAndSystems.length > 0;

  if (overviewLength >= MIN_STRONG_OVERVIEW_CHARS && hasOutcome && (hasNamedSystem || hasPeopleOrSystems)) {
    return "strong-foundation";
  }

  if (overviewLength >= MIN_CLARIFICATION_OVERVIEW_CHARS || hasOutcome) {
    return "needs-clarification";
  }

  return "insufficient-context";
}

function buildSummaryFields(input: BuildArchitectureCreatedHomeModelInput): ArchitectureSummaryField[] {
  const fields: ArchitectureSummaryField[] = [];
  const humans = input.peopleAndSystems
    .filter((entry) => entry.kind === "Human" || entry.kind === "Both")
    .map((entry) => entry.label);
  const systems = input.peopleAndSystems
    .filter((entry) => entry.kind === "Machine" || entry.kind === "Both")
    .map((entry) => entry.label);
  const integrations = input.peopleAndSystems
    .filter((entry) => entry.kind === "Machine")
    .map((entry) => entry.label);

  const businessPurpose =
    input.businessOutcome.trim().length > 0
      ? truncateSummary(input.businessOutcome, 220)
      : truncateSummary(firstSentence(input.architectureOverview), 220);

  if (businessPurpose.length > 0) {
    fields.push({ label: ARCHITECTURE_SUMMARY_LABELS.businessPurpose, value: businessPurpose });
  }

  if (humans.length > 0) {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.primaryUsers,
      value: humans.slice(0, 4).join(", "),
    });
  }

  if (systems.length > 0) {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.majorSystems,
      value: systems.slice(0, 4).join(", "),
    });
  } else if (input.architectureName.trim().length > 0) {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.majorSystems,
      value: input.architectureName.trim(),
    });
  }

  if (integrations.length > 0) {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.keyIntegrations,
      value: integrations.slice(0, 4).join(", "),
    });
  }

  return fields.slice(0, 4);
}

function resolveClarifyHref(input: BuildArchitectureCreatedHomeModelInput): string {
  return buildArchitectureCorrectionHref(input.runId, input.correctionHref);
}

function buildGapSource(input: BuildArchitectureCreatedHomeModelInput): ClarificationGapSource {
  return buildClarificationGapSourcePresentation({
    capturedAtUtc: input.gapSourceCapturedAtUtc,
    fromHandoff: input.gapSourceCapturedAtUtc !== null,
  });
}

function buildMissingItems(input: BuildArchitectureCreatedHomeModelInput): ArchitectureMissingItem[] {
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
      href: buildArchitectureWorkspaceTabHref(input.runId, "evidence"),
      category: "evidence",
      source,
    });
  }

  if (input.assessmentInProgress) {
    items.push({
      id: "assessment-progress",
      label: "Initial assessment is still running",
      href: buildArchitectureWorkspaceTabHref(input.runId, "activity"),
      category: "assessment",
      source,
    });
  }

  return items.slice(0, MAX_MISSING_ITEMS);
}

function partitionMissingItems(items: readonly ArchitectureMissingItem[]): {
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

function buildPrimaryActions(
  input: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreatedPrimaryAction[] {
  const clarifyHref = resolveClarifyHref(input);
  const diagramHref = buildArchitectureWorkspaceTabHref(input.runId, "diagram");
  const assessmentHref = buildArchitectureWorkspaceTabHref(input.runId, "activity");
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
    overflowActions: [
      { label: "View assessment details", href: buildArchitectureWorkspaceTabHref(input.runId, "findings") },
      { label: "Architecture diagram", href: buildArchitectureWorkspaceTabHref(input.runId, "diagram") },
      { label: "Add evidence", href: buildArchitectureWorkspaceTabHref(input.runId, "evidence") },
      { label: "Submitted architecture", href: buildArchitectureWorkspaceTabHref(input.runId, "overview") },
    ],
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
