import { ARCHITECTURE_SUMMARY_LABELS } from "@/lib/architecture/architecture-created-home-copy";
import { UNTITLED_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-draft-status";
import { formatParsedSubmittedArchitectureName } from "@/lib/derive-architecture-gap-baseline";
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
  readonly peopleAndSystems: readonly {
    readonly label: string;
    readonly kind: string;
    readonly fromSubmittedParse?: boolean;
  }[];
  readonly keyIntegrations?: readonly string[];
  readonly submittedBriefStored?: boolean;
  readonly artifactBundleKnown?: boolean;
  readonly ownerLabel: string | null;
  readonly lastUpdatedLabel: string;
  readonly homeTimestampPrefix?: string;
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
const SUMMARY_LIST_VISIBLE_LIMIT = 4;
const SUMMARY_BUSINESS_PURPOSE_CHAR_LIMIT = 220;

export const ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED =
  "Business purpose was not stored." as const;

export const ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED =
  "Major systems were not stored." as const;

export const ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED =
  "Primary users were not stored." as const;

export const ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED =
  "Key integrations were not stored." as const;

export const ARCHITECTURE_CREATED_INTEGRATIONS_NOT_STORED_SEPARATELY =
  "Integrations were not stored separately from actors." as const;

export const ARCHITECTURE_CREATED_KEY_INTEGRATIONS_OMITTED =
  "Key integrations were not stored on this draft." as const;

export const ARCHITECTURE_CREATED_INTEGRATION_NAMES_NOT_STORED =
  "Integration names were not stored." as const;

export const DEFAULT_GAP_ASSERTION: ArchitectureGapAssertionFlags = {
  businessOutcome: true,
  peopleAndSystems: true,
};

function formatSummaryList(
  labels: readonly string[],
  notStoredCopy: string,
  options?: { readonly fromSubmittedParse?: boolean },
): string {
  const trimmed = labels
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
    .map((label) => (options?.fromSubmittedParse === true ? formatParsedSubmittedArchitectureName(label) : label));

  if (trimmed.length === 0) {
    return notStoredCopy;
  }

  if (trimmed.length <= SUMMARY_LIST_VISIBLE_LIMIT) {
    return trimmed.join(", ");
  }

  const visible = trimmed.slice(0, SUMMARY_LIST_VISIBLE_LIMIT).join(", ");
  const remaining = trimmed.length - SUMMARY_LIST_VISIBLE_LIMIT;

  return `${visible} (${remaining} more ${remaining === 1 ? "entry was" : "entries were"} stored.)`;
}

function formatBusinessPurposeSummary(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return ARCHITECTURE_CREATED_BUSINESS_PURPOSE_NOT_STORED;
  }

  if (trimmed.length <= SUMMARY_BUSINESS_PURPOSE_CHAR_LIMIT) {
    return trimmed;
  }

  const visible = trimmed.slice(0, SUMMARY_BUSINESS_PURPOSE_CHAR_LIMIT).trimEnd();

  return `${visible}… (Full business purpose was stored.)`;
}

export function deriveDefinitionStatus(
  input: BuildArchitectureCreatedHomeModelInput,
): ArchitectureDefinitionStatusKind {
  const overviewLength = input.architectureOverview.trim().length;
  const hasOutcome = input.businessOutcome.trim().length >= MIN_OUTCOME_CHARS;
  const normalizedName = input.architectureName.trim();
  const hasNamedSystem =
    normalizedName.length > 0 &&
    normalizedName.toLowerCase() !== "untitled architecture" &&
    normalizedName !== UNTITLED_ARCHITECTURE_LABEL;
  const hasPeopleOrSystems = input.peopleAndSystems.length > 0;

  if (overviewLength >= MIN_STRONG_OVERVIEW_CHARS && hasOutcome && (hasNamedSystem || hasPeopleOrSystems)) {
    return "strong-foundation";
  }

  if (overviewLength >= MIN_CLARIFICATION_OVERVIEW_CHARS || hasOutcome) {
    return "needs-clarification";
  }

  return "insufficient-context";
}

export const ARCHITECTURE_CREATED_PRIMARY_USERS_STORED_EMPTY =
  "Primary users were stored empty." as const;

export const ARCHITECTURE_CREATED_MAJOR_SYSTEMS_STORED_EMPTY =
  "Major systems were stored empty." as const;

export const ARCHITECTURE_CREATED_ACTOR_KIND_NOT_STORED = "Actor kind was not stored." as const;

export const ARCHITECTURE_CREATED_ACTOR_STORED_AS_BOTH = " (stored as Both)" as const;

type ActorSummaryEntry = BuildArchitectureCreatedHomeModelInput["peopleAndSystems"][number];

function formatActorSummaryLabel(entry: ActorSummaryEntry): string {
  const trimmed = entry.label.trim();

  if (trimmed.length === 0) {
    return "";
  }

  let label =
    entry.fromSubmittedParse === true ? formatParsedSubmittedArchitectureName(trimmed) : trimmed;

  if (entry.fromSubmittedParse !== true && entry.kind.trim().length === 0) {
    label = `${label} — ${ARCHITECTURE_CREATED_ACTOR_KIND_NOT_STORED}`;
  } else if (entry.kind === "Both") {
    label = `${label}${ARCHITECTURE_CREATED_ACTOR_STORED_AS_BOTH}`;
  }

  return label;
}

export function buildSummaryFields(input: BuildArchitectureCreatedHomeModelInput): ArchitectureSummaryField[] {
  const fields: ArchitectureSummaryField[] = [];
  const humanEntries = input.peopleAndSystems.filter(
    (entry) => entry.kind === "Human" || entry.kind === "Both" || entry.kind.trim().length === 0,
  );
  const humanLabels = humanEntries.map(formatActorSummaryLabel).filter((label) => label.length > 0);
  const systemEntries = input.peopleAndSystems.filter(
    (entry) => entry.kind === "Machine" || entry.kind === "Both",
  );
  const systemLabels = systemEntries.map(formatActorSummaryLabel).filter((label) => label.length > 0);
  const integrationLabels = (input.keyIntegrations ?? [])
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
  const businessPurpose = formatBusinessPurposeSummary(input.businessOutcome);

  fields.push({ label: ARCHITECTURE_SUMMARY_LABELS.businessPurpose, value: businessPurpose });

  fields.push({
    label: ARCHITECTURE_SUMMARY_LABELS.primaryUsers,
    value:
      humanLabels.length > 0
        ? formatSummaryList(humanLabels, ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED)
        : humanEntries.some((entry) => entry.label.trim().length === 0)
          ? ARCHITECTURE_CREATED_PRIMARY_USERS_STORED_EMPTY
          : ARCHITECTURE_CREATED_PRIMARY_USERS_NOT_STORED,
  });

  fields.push({
    label: ARCHITECTURE_SUMMARY_LABELS.majorSystems,
    value:
      systemLabels.length > 0
        ? formatSummaryList(systemLabels, ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED)
        : systemEntries.some((entry) => entry.label.trim().length === 0)
          ? ARCHITECTURE_CREATED_MAJOR_SYSTEMS_STORED_EMPTY
          : ARCHITECTURE_CREATED_MAJOR_SYSTEMS_NOT_STORED,
  });

  fields.push({
    label: ARCHITECTURE_SUMMARY_LABELS.keyIntegrations,
    value:
      input.keyIntegrations === undefined
        ? ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED
        : integrationLabels.length > 0
          ? formatSummaryList(integrationLabels, ARCHITECTURE_CREATED_KEY_INTEGRATIONS_NOT_STORED)
          : ARCHITECTURE_CREATED_INTEGRATION_NAMES_NOT_STORED,
  });

  return fields;
}
