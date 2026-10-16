import { ARCHITECTURE_SUMMARY_LABELS } from "@/lib/architecture/architecture-created-home-copy";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";

export type ArchitectureDefinitionStatusKind =
  | "strong-foundation"
  | "needs-clarification"
  | "insufficient-context";

export type ArchitectureSummaryField = {
  readonly label: string;
  readonly value: string;
};

export type ArchitectureGapAssertionFlags = {
  readonly businessOutcome: boolean;
  readonly peopleAndSystems: boolean;
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
  readonly findingsDerivedQuestions?: readonly ReviewClarificationQuestion[];
  readonly clarificationRoundAvailable?: boolean;
  readonly clarificationPriorRunId?: string | null;
};

const MIN_STRONG_OVERVIEW_CHARS = 100;
const MIN_CLARIFICATION_OVERVIEW_CHARS = 40;
const MIN_OUTCOME_CHARS = 10;

export const ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED =
  "Business purpose was not stored." as const;

export const ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED =
  "Major systems were not stored." as const;

export const ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED =
  "Primary users were not stored." as const;

export const ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED =
  "Key integrations were not stored." as const;

export const DEFAULT_GAP_ASSERTION: ArchitectureGapAssertionFlags = {
  businessOutcome: true,
  peopleAndSystems: true,
};

function truncateSummary(value: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function deriveDefinitionStatus(
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

export function buildSummaryFields(input: BuildArchitectureCreatedHomeModelInput): ArchitectureSummaryField[] {
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
      : ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED;

  fields.push({ label: ARCHITECTURE_SUMMARY_LABELS.businessPurpose, value: businessPurpose });

  fields.push({
    label: ARCHITECTURE_SUMMARY_LABELS.primaryUsers,
    value:
      humans.length > 0
        ? humans.slice(0, 4).join(", ")
        : ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED,
  });

  if (systems.length > 0) {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.majorSystems,
      value: systems.slice(0, 4).join(", "),
    });
  } else {
    fields.push({
      label: ARCHITECTURE_SUMMARY_LABELS.majorSystems,
      value: ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED,
    });
  }

  fields.push({
    label: ARCHITECTURE_SUMMARY_LABELS.keyIntegrations,
    value:
      integrations.length > 0
        ? integrations.slice(0, 4).join(", ")
        : ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED,
  });

  return fields;
}
