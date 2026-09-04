import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import type { CoveragePreviewGroupKey } from "@/lib/coverage-preview";

const EXCLUDED_SELECTION_STATES = new Set([
  "RecommendedButExcluded",
  "OptionalAndNotSelected",
  "NotApplicable",
  "Retired",
]);

function coverageTypeToGroupKey(coverageType: string): CoveragePreviewGroupKey | null {
  switch (coverageType) {
    case "ProviderNeutralBaseline":
      return "baseline";
    case "OrganizationRequired":
      return "organizationRequired";
    case "PlatformOverlay":
      return "platformOverlay";
    case "ContextualRecommended":
      return "contextualRecommended";
    case "AdditionalOptional":
      return "additionalOptional";
    default:
      return null;
  }
}

function isActiveCoverageRow(selectionState: string): boolean {
  const normalized = selectionState.trim();

  if (normalized.length === 0) {
    return true;
  }

  return !EXCLUDED_SELECTION_STATES.has(normalized);
}

/** Summarize committed coverage rows by PP-COV coverage bucket (additive to legacy ruleSetId headline). */
export function buildCommittedCoverageScopeLine(
  snapshot: CompareEffectiveGovernanceAtCommitSnapshot | null | undefined,
): string | null {
  if (snapshot === null || snapshot === undefined) {
    return null;
  }

  const coverageAssignments = snapshot.coverageAssignments ?? [];

  if (coverageAssignments.length === 0) {
    const packCount = snapshot.packAssignments?.length ?? 0;

    if (packCount > 1) {
      return `${packCount} policy pack assignment(s) were frozen at commit.`;
    }

    return null;
  }

  const counts: Partial<Record<CoveragePreviewGroupKey, number>> = {};

  for (const row of coverageAssignments) {
    if (!isActiveCoverageRow(row.selectionState)) {
      continue;
    }

    const groupKey = coverageTypeToGroupKey(row.coverageType);

    if (groupKey === null) {
      continue;
    }

    counts[groupKey] = (counts[groupKey] ?? 0) + 1;
  }

  const parts: string[] = [];

  if ((counts.baseline ?? 0) > 0) {
    parts.push(`${counts.baseline} baseline quality dimension${counts.baseline === 1 ? "" : "s"}`);
  }

  if ((counts.organizationRequired ?? 0) > 0) {
    parts.push(`${counts.organizationRequired} organization-required pack${counts.organizationRequired === 1 ? "" : "s"}`);
  }

  if ((counts.platformOverlay ?? 0) > 0) {
    parts.push(`${counts.platformOverlay} platform overlay${counts.platformOverlay === 1 ? "" : "s"}`);
  }

  if ((counts.contextualRecommended ?? 0) > 0) {
    parts.push(`${counts.contextualRecommended} contextual pack${counts.contextualRecommended === 1 ? "" : "s"}`);
  }

  if ((counts.additionalOptional ?? 0) > 0) {
    parts.push(`${counts.additionalOptional} additional pack${counts.additionalOptional === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `Committed coverage: ${parts.join(", ")}.`;
}

export function buildCommittedPolicyPackEvaluationHeadline(input: {
  readonly ruleSetId: string;
  readonly ruleSetVersion?: string | null;
  readonly packLabel: string;
  readonly effectiveGovernanceAtCommit?: CompareEffectiveGovernanceAtCommitSnapshot | null;
}): string {
  const packAssignments = input.effectiveGovernanceAtCommit?.packAssignments ?? [];
  const coverageLine = buildCommittedCoverageScopeLine(input.effectiveGovernanceAtCommit);

  if (packAssignments.length > 1) {
    const base = `Evaluated against ${packAssignments.length} committed policy packs`;

    return coverageLine !== null ? `${base} (${coverageLine.replace("Committed coverage: ", "").replace(/\.$/, "")}).` : `${base}.`;
  }

  if (coverageLine !== null) {
    return `Evaluated against ${input.packLabel}. ${coverageLine}`;
  }

  return `Evaluated against ${input.packLabel}.`;
}
