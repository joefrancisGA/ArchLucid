import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  inferPolicyPackDisplayNameFromComplianceRuleKey,
  coerceComplianceRuleKey,
} from "@/lib/policy-pack-rule-key-prefix-catalog";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type PolicyPackFindingGroup = {
  readonly groupKey: string;
  readonly packDisplayName: string;
  readonly findingCount: number;
};

export type PolicyPackFindingGroupDetail = PolicyPackFindingGroup & {
  readonly findings: readonly QuickDecisionFinding[];
};

function manifestFallbackPackLabel(ruleSetId: string | null | undefined, ruleSetVersion: string | null | undefined): string | null {
  const id = ruleSetId?.trim() ?? "";

  if (id.length === 0) {
    return null;
  }

  return policyPackBuyerLabel(id, ruleSetVersion ?? "");
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

  return "Unmapped findings";
}

/** Summarizes how many findings map to each inferred policy pack (for review detail hero strip). */
export function summarizeQuickDecisionFindingsByPolicyPack(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId?: string | null,
  manifestRuleSetVersion?: string | null,
): readonly PolicyPackFindingGroup[] {
  const manifestPackLabel = manifestFallbackPackLabel(manifestRuleSetId, manifestRuleSetVersion);
  const counts = new Map<string, { packDisplayName: string; findingCount: number }>();

  for (const finding of findings) {
    const packDisplayName = resolvePackLabelForFinding(finding, manifestPackLabel);
    const groupKey = packDisplayName.toLowerCase();
    const existing = counts.get(groupKey);

    if (existing === undefined) {
      counts.set(groupKey, { packDisplayName, findingCount: 1 });
    } else {
      counts.set(groupKey, { packDisplayName, findingCount: existing.findingCount + 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.findingCount - a.findingCount || a.packDisplayName.localeCompare(b.packDisplayName))
    .map((entry) => ({
      groupKey: entry.packDisplayName.toLowerCase(),
      packDisplayName: entry.packDisplayName,
      findingCount: entry.findingCount,
    }));
}

/** Groups findings by inferred policy pack for section rendering on review detail. */
export function groupQuickDecisionFindingsByPolicyPack(
  findings: readonly QuickDecisionFinding[],
  manifestRuleSetId?: string | null,
  manifestRuleSetVersion?: string | null,
): readonly PolicyPackFindingGroupDetail[] {
  const manifestPackLabel = manifestFallbackPackLabel(manifestRuleSetId, manifestRuleSetVersion);
  const groups = new Map<string, PolicyPackFindingGroupDetail>();

  for (const finding of findings) {
    const packDisplayName = resolvePackLabelForFinding(finding, manifestPackLabel);
    const groupKey = packDisplayName.toLowerCase();
    const existing = groups.get(groupKey);

    if (existing === undefined) {
      groups.set(groupKey, {
        groupKey,
        packDisplayName,
        findingCount: 1,
        findings: [finding],
      });
    } else {
      groups.set(groupKey, {
        ...existing,
        findingCount: existing.findingCount + 1,
        findings: [...existing.findings, finding],
      });
    }
  }

  return [...groups.values()].sort(
    (a, b) => b.findingCount - a.findingCount || a.packDisplayName.localeCompare(b.packDisplayName),
  );
}
