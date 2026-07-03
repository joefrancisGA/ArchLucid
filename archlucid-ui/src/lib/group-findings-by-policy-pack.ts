import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { policyPacksEditHref, policyPacksRuleHref } from "@/lib/policy-packs-deep-link";
import {
  inferPolicyPackDisplayNameFromComplianceRuleKey,
  coerceComplianceRuleKey,
} from "@/lib/policy-pack-rule-key-prefix-catalog";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type PolicyPackFindingGroup = {
  readonly groupKey: string;
  readonly packDisplayName: string;
  readonly findingCount: number;
  readonly packHref: string | null;
};

export type PolicyPackFindingGroupDetail = PolicyPackFindingGroup & {
  readonly findings: readonly QuickDecisionFinding[];
};

export type PolicyPackFindingImpactSummary = {
  readonly groups: readonly PolicyPackFindingGroup[];
  readonly totalFindings: number;
  readonly mappedFindingCount: number;
  readonly unmappedFindingCount: number;
};

const UNMAPPED_GROUP_LABEL = "Unmapped findings";

function manifestFallbackPackLabel(
  ruleSetId: string | null | undefined,
  ruleSetVersion: string | null | undefined,
): string | null {
  const id = ruleSetId?.trim() ?? "";

  if (id.length === 0) {
    return null;
  }

  return policyPackBuyerLabel(id, ruleSetVersion ?? "");
}

function resolvePackHrefForGroup(
  packDisplayName: string,
  representativeRuleId: string | null,
  manifestRuleSetId: string | null,
  manifestPackLabel: string | null,
): string | null {
  if (packDisplayName === UNMAPPED_GROUP_LABEL) {
    return null;
  }

  const governanceHref =
    manifestRuleSetId !== null ? policyPackBuyerGovernanceDetailHref(manifestRuleSetId) : null;

  if (
    manifestPackLabel !== null &&
    packDisplayName === manifestPackLabel &&
    manifestRuleSetId !== null
  ) {
    return governanceHref ?? policyPacksEditHref(manifestRuleSetId);
  }

  if (representativeRuleId !== null) {
    return policyPacksRuleHref(representativeRuleId);
  }

  if (manifestRuleSetId !== null) {
    return governanceHref ?? policyPacksEditHref(manifestRuleSetId);
  }

  return null;
}

function resolvePackLabelForFinding(
  finding: QuickDecisionFinding,
  manifestPackLabel: string | null,
): string {
  const fromRule = inferPolicyPackDisplayNameFromComplianceRuleKey(finding.policyRuleId);

  if (fromRule !== null) {
    return fromRule;
  }

  if (manifestPackLabel !== null) {
    return manifestPackLabel;
  }

  const ruleKey = coerceComplianceRuleKey(finding.policyRuleId);

  if (ruleKey !== null) {
    return "Other policy rules";
  }

  return UNMAPPED_GROUP_LABEL;
}

function isMappedPackLabel(packDisplayName: string): boolean {
  return packDisplayName !== UNMAPPED_GROUP_LABEL;
}

type MutableGroup = PolicyPackFindingGroupDetail & {
  representativeRuleId: string | null;
};

function buildGroupsFromFindings(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId: string | null,
  manifestRuleSetVersion: string | null,
): readonly PolicyPackFindingGroupDetail[] {
  const manifestPackLabel = manifestFallbackPackLabel(manifestRuleSetId, manifestRuleSetVersion);
  const manifestId = manifestRuleSetId?.trim() ?? "";
  const groups = new Map<string, MutableGroup>();

  for (const finding of findings) {
    const packDisplayName = resolvePackLabelForFinding(finding, manifestPackLabel);
    const groupKey = packDisplayName.toLowerCase();
    const ruleId = coerceComplianceRuleKey(finding.policyRuleId);
    const existing = groups.get(groupKey);

    if (existing === undefined) {
      groups.set(groupKey, {
        groupKey,
        packDisplayName,
        findingCount: 1,
        packHref: resolvePackHrefForGroup(
          packDisplayName,
          ruleId,
          manifestId.length > 0 ? manifestId : null,
          manifestPackLabel,
        ),
        findings: [finding],
        representativeRuleId: ruleId,
      });
    } else {
      const representativeRuleId = existing.representativeRuleId ?? ruleId;

      groups.set(groupKey, {
        ...existing,
        findingCount: existing.findingCount + 1,
        findings: [...existing.findings, finding],
        representativeRuleId,
        packHref:
          existing.packHref ??
          resolvePackHrefForGroup(
            packDisplayName,
            representativeRuleId,
            manifestId.length > 0 ? manifestId : null,
            manifestPackLabel,
          ),
      });
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.findingCount - a.findingCount || a.packDisplayName.localeCompare(b.packDisplayName))
    .map((group) => {
      const { representativeRuleId, ...rest } = group;
      void representativeRuleId;
      return rest;
    });
}

/** Summarizes how many findings map to each inferred policy pack (for review detail hero strip). */
export function summarizeQuickDecisionFindingsByPolicyPack(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId?: string | null,
  manifestRuleSetVersion?: string | null,
): readonly PolicyPackFindingGroup[] {
  return buildGroupsFromFindings(findings, manifestRuleSetId ?? null, manifestRuleSetVersion ?? null).map(
    (group) => {
      const { findings: groupedFindings, ...summary } = group;
      void groupedFindings;
      return summary;
    },
  );
}

/** Groups findings by inferred policy pack for section rendering on review detail. */
export function groupQuickDecisionFindingsByPolicyPack(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId?: string | null,
  manifestRuleSetVersion?: string | null,
): readonly PolicyPackFindingGroupDetail[] {
  return buildGroupsFromFindings(findings, manifestRuleSetId ?? null, manifestRuleSetVersion ?? null);
}

/** Counts policy-mapped vs unmapped findings for review-detail impact callouts. */
export function summarizePolicyPackFindingImpact(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId?: string | null,
  manifestRuleSetVersion?: string | null,
): PolicyPackFindingImpactSummary {
  const groups = summarizeQuickDecisionFindingsByPolicyPack(findings, manifestRuleSetId, manifestRuleSetVersion);
  const totalFindings = findings.length;
  const mappedFindingCount = groups
    .filter((group) => isMappedPackLabel(group.packDisplayName))
    .reduce((sum, group) => sum + group.findingCount, 0);
  const unmappedFindingCount = Math.max(0, totalFindings - mappedFindingCount);

  return {
    groups,
    totalFindings,
    mappedFindingCount,
    unmappedFindingCount,
  };
}

export function resolveReviewDetailPolicyPackHref(
  ruleSetId: string | null | undefined,
): string | null {
  const id = ruleSetId?.trim() ?? "";

  if (id.length === 0) {
    return null;
  }

  return policyPackBuyerGovernanceDetailHref(id) ?? policyPacksEditHref(id);
}
