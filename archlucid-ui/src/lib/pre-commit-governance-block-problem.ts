import type { ApiProblemDetails } from "@/lib/api-problem";

export type PreCommitGovernanceBlockView = {
  readonly reason: string;
  readonly blockingFindingIds: readonly string[];
  readonly policyPackId: string | null;
  readonly minimumBlockingSeverityLabel: string | null;
  readonly blockExplanation: string | null;
};

const GOVERNANCE_PRE_COMMIT_BLOCKED_ERROR_CODE = "GOVERNANCE_PRE_COMMIT_BLOCKED";
const GOVERNANCE_PRE_COMMIT_BLOCKED_TYPE_FRAGMENT = "governance-pre-commit-blocked";

/** Maps API contract ordinal (`FindingSeverity`) to operator-facing label. */
export function findingSeverityLabelFromOrdinal(ordinal: number): string | null {
  if (!Number.isFinite(ordinal)) {
    return null;
  }

  const normalized = Math.trunc(ordinal);

  switch (normalized) {
    case 0:
      return "Info";

    case 1:
      return "Warning";

    case 2:
      return "Error";

    case 3:
      return "Critical";

    default:
      return null;
  }
}

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function readOptionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalSeverityOrdinal(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

/** True when Problem Details carry pre-commit governance block extensions or error code. */
export function isPreCommitGovernanceBlockProblem(problem: ApiProblemDetails | null | undefined): boolean {
  if (problem == null) {
    return false;
  }

  const errorCode = problem.errorCode?.trim();

  if (errorCode === GOVERNANCE_PRE_COMMIT_BLOCKED_ERROR_CODE) {
    return true;
  }

  const type = problem.type?.trim().toLowerCase() ?? "";

  if (type.includes(GOVERNANCE_PRE_COMMIT_BLOCKED_TYPE_FRAGMENT)) {
    return true;
  }

  if ((problem.blockingFindingIds?.length ?? 0) > 0) {
    return true;
  }

  const policyPackId = problem.policyPackId?.trim() ?? "";

  return policyPackId.length > 0;
}

/** Builds operator-facing structured view from governance pre-commit Problem Details. */
export function resolvePreCommitGovernanceBlockView(
  problem: ApiProblemDetails | null | undefined,
): PreCommitGovernanceBlockView | null {
  if (!isPreCommitGovernanceBlockProblem(problem) || problem == null) {
    return null;
  }

  const reason =
    problem.detail?.trim() ||
    problem.title?.trim() ||
    "Policy rules blocked review finalization.";

  const severityOrdinal = readOptionalSeverityOrdinal(problem.minimumBlockingSeverity);
  const minimumBlockingSeverityLabel =
    severityOrdinal === null ? null : findingSeverityLabelFromOrdinal(severityOrdinal);

  const blockExplanation = problem.blockExplanation?.trim() || null;

  return {
    reason,
    blockingFindingIds: problem.blockingFindingIds ?? [],
    policyPackId: readOptionalTrimmedString(problem.policyPackId),
    minimumBlockingSeverityLabel,
    blockExplanation: blockExplanation !== null && blockExplanation.length > 0 ? blockExplanation : null,
  };
}

/** @internal Exported for tests that mirror raw Problem Details JSON shape. */
export function readPreCommitGovernanceBlockFieldsFromRecord(record: Record<string, unknown>): {
  blockingFindingIds: readonly string[];
  policyPackId: string | null;
  minimumBlockingSeverity: number | null;
} {
  const extensions =
    record.extensions !== null &&
    record.extensions !== undefined &&
    typeof record.extensions === "object" &&
    !Array.isArray(record.extensions)
      ? (record.extensions as Record<string, unknown>)
      : null;

  const rootFindingIds = readStringArray(record.blockingFindingIds);
  const blockingFindingIds =
    rootFindingIds.length > 0
      ? rootFindingIds
      : extensions !== null
        ? readStringArray(extensions.blockingFindingIds)
        : [];

  const policyPackId =
    readOptionalTrimmedString(record.policyPackId) ??
    (extensions !== null ? readOptionalTrimmedString(extensions.policyPackId) : null);

  const minimumBlockingSeverity =
    readOptionalSeverityOrdinal(record.minimumBlockingSeverity) ??
    (extensions !== null ? readOptionalSeverityOrdinal(extensions.minimumBlockingSeverity) : null);

  return {
    blockingFindingIds,
    policyPackId,
    minimumBlockingSeverity,
  };
}
