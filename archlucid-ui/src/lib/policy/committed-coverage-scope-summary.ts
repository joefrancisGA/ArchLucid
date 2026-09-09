import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import type { CoveragePreviewGroupKey } from "@/lib/coverage-preview";

const EXCLUDED_SELECTION_STATES = new Set([
  "RecommendedButExcluded",
  "OptionalAndNotSelected",
  "NotApplicable",
  "Retired",
]);

export type CommittedCoverageExclusionLine = {
  readonly packLabel: string;
  readonly reason: string;
};

function isExcludedCoverageRow(selectionState: string): boolean {
  const normalized = selectionState.trim();

  if (normalized.length === 0) {
    return false;
  }

  return EXCLUDED_SELECTION_STATES.has(normalized);
}

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
    parts.push(`${counts.baseline} core architecture quality area${counts.baseline === 1 ? "" : "s"}`);
  }

  if ((counts.organizationRequired ?? 0) > 0) {
    parts.push(`${counts.organizationRequired} required organizational standard${counts.organizationRequired === 1 ? "" : "s"}`);
  }

  if ((counts.platformOverlay ?? 0) > 0) {
    parts.push(`${counts.platformOverlay} cloud best-practice framework${counts.platformOverlay === 1 ? "" : "s"}`);
  }

  if ((counts.contextualRecommended ?? 0) > 0) {
    parts.push(`${counts.contextualRecommended} project-specific recommendation${counts.contextualRecommended === 1 ? "" : "s"}`);
  }

  if ((counts.additionalOptional ?? 0) > 0) {
    parts.push(`${counts.additionalOptional} optional policy pack${counts.additionalOptional === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `Assurance scope at commit: ${parts.join(", ")}.`;
}

/** Buyer-facing lines for packs explicitly excluded before execute. */
export function buildCommittedCoverageExclusionLines(
  snapshot: CompareEffectiveGovernanceAtCommitSnapshot | null | undefined,
  resolvePackLabel: (policyPackId: string, policyPackVersion: string) => string = (policyPackId, policyPackVersion) => {
    const version = policyPackVersion.trim();

    return version.length > 0 ? `${policyPackId} v${version}` : policyPackId;
  },
): readonly CommittedCoverageExclusionLine[] {
  if (snapshot === null || snapshot === undefined) {
    return [];
  }

  const lines: CommittedCoverageExclusionLine[] = [];

  for (const row of snapshot.coverageAssignments ?? []) {
    if (!isExcludedCoverageRow(row.selectionState)) {
      continue;
    }

    const reason = row.exclusionReason?.trim();

    if (reason === undefined || reason.length === 0) {
      continue;
    }

    lines.push({
      packLabel: resolvePackLabel(row.policyPackId, row.policyPackVersion),
      reason,
    });
  }

  return lines;
}

export function buildCommittedCoverageExclusionSummary(
  snapshot: CompareEffectiveGovernanceAtCommitSnapshot | null | undefined,
  resolvePackLabel?: (policyPackId: string, policyPackVersion: string) => string,
): string | null {
  const lines = buildCommittedCoverageExclusionLines(snapshot, resolvePackLabel);

  if (lines.length === 0) {
    return null;
  }

  const formatted = lines.map((line) => `${line.packLabel} (${line.reason})`).join("; ");

  if (lines.length === 1) {
    return `One standard was excluded from assurance scope for this review: ${formatted}.`;
  }

  return `${lines.length} standards were excluded from assurance scope for this review: ${formatted}.`;
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

    return coverageLine !== null ? `${base} (${coverageLine.replace("Assurance scope at commit: ", "").replace(/\.$/, "")}).` : `${base}.`;
  }

  if (coverageLine !== null) {
    return `Evaluated against ${input.packLabel}. ${coverageLine}`;
  }

  return `Evaluated against ${input.packLabel}.`;
}
