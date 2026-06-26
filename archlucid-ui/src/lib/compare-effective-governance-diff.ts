import { diffComplianceRuleKeys, type ComplianceRuleKeyDiffItem } from "@/lib/policy-pack-compliance-rule-key-diff";
import type { EffectivePolicyPackSet, PolicyPackContentDocument } from "@/types/policy-packs";

export const COMPARE_GOVERNANCE_CURRENT_EFFECTIVE_DISCLAIMER =
  "Effective policy pack assignments and compliance rule keys reflect the current scope — not a historical snapshot at each review commit. Compare rule set labels below from each committed review package.";

export type CompareManifestGovernanceSnapshot = {
  readonly ruleSetId: string | null;
  readonly ruleSetVersion: string | null;
  readonly complianceRuleKeyCount: number | null;
  readonly complianceRuleKeys: readonly string[];
};

export type CompareEffectiveGovernanceSnapshot = {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly packAssignments: readonly CompareEffectivePackAssignmentRow[];
  readonly complianceRuleKeyCount: number;
  readonly complianceRuleKeys: readonly string[];
};

export type CompareEffectivePackAssignmentRow = {
  readonly policyPackId: string;
  readonly name: string;
  readonly version: string;
};

export type CompareManifestRuleSetChange = {
  readonly field: "ruleSetId" | "ruleSetVersion";
  readonly baselineValue: string | null;
  readonly targetValue: string | null;
};

export type CompareGovernanceDiffView = {
  readonly baselineManifest: CompareManifestGovernanceSnapshot;
  readonly targetManifest: CompareManifestGovernanceSnapshot;
  readonly manifestRuleSetChanges: readonly CompareManifestRuleSetChange[];
  readonly currentEffective: CompareEffectiveGovernanceSnapshot | null;
  readonly usesCurrentEffectiveOnly: boolean;
  readonly complianceRuleKeyDiff: readonly ComplianceRuleKeyDiffItem[];
  readonly materialComplianceRuleKeyChanges: readonly ComplianceRuleKeyDiffItem[];
  readonly hasManifestGovernanceDelta: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const out: string[] = [];

  for (const item of value) {
    const trimmed = readTrimmedString(item);

    if (trimmed !== null) {
      out.push(trimmed);
    }
  }

  return out;
}

function extractComplianceRuleKeysFromManifestRecord(record: Record<string, unknown>): string[] {
  const policy = isRecord(record.policy) ? record.policy : null;
  const compliance = isRecord(record.compliance) ? record.compliance : null;

  const fromPolicy = policy !== null ? readStringArray(policy.complianceRuleKeys) : [];
  const fromCompliance = compliance !== null ? readStringArray(compliance.complianceRuleKeys) : [];

  if (fromPolicy.length > 0) {
    return fromPolicy;
  }

  return fromCompliance;
}

/** Parses persisted golden manifest fields that describe governance basis at commit time. */
export function parseCompareManifestGovernanceSnapshot(manifest: unknown): CompareManifestGovernanceSnapshot {
  if (!isRecord(manifest)) {
    return {
      ruleSetId: null,
      ruleSetVersion: null,
      complianceRuleKeyCount: null,
      complianceRuleKeys: [],
    };
  }

  const complianceRuleKeys = extractComplianceRuleKeysFromManifestRecord(manifest);

  return {
    ruleSetId: readTrimmedString(manifest.ruleSetId),
    ruleSetVersion: readTrimmedString(manifest.ruleSetVersion),
    complianceRuleKeyCount: complianceRuleKeys.length > 0 ? complianceRuleKeys.length : null,
    complianceRuleKeys,
  };
}

export function buildCompareEffectiveGovernanceSnapshot(
  effective: EffectivePolicyPackSet,
  effectiveContent: PolicyPackContentDocument | null,
): CompareEffectiveGovernanceSnapshot {
  const packAssignments: CompareEffectivePackAssignmentRow[] = effective.packs.map((pack) => ({
    policyPackId: pack.policyPackId.trim(),
    name: pack.name.trim(),
    version: pack.version.trim(),
  }));

  const complianceRuleKeys = effectiveContent?.complianceRuleKeys ?? [];

  return {
    tenantId: effective.tenantId,
    workspaceId: effective.workspaceId,
    projectId: effective.projectId,
    packAssignments,
    complianceRuleKeyCount: complianceRuleKeys.length,
    complianceRuleKeys,
  };
}

export function diffCompareManifestRuleSets(
  baseline: CompareManifestGovernanceSnapshot,
  target: CompareManifestGovernanceSnapshot,
): CompareManifestRuleSetChange[] {
  const changes: CompareManifestRuleSetChange[] = [];

  if (baseline.ruleSetId !== target.ruleSetId) {
    changes.push({
      field: "ruleSetId",
      baselineValue: baseline.ruleSetId,
      targetValue: target.ruleSetId,
    });
  }

  if (baseline.ruleSetVersion !== target.ruleSetVersion) {
    changes.push({
      field: "ruleSetVersion",
      baselineValue: baseline.ruleSetVersion,
      targetValue: target.ruleSetVersion,
    });
  }

  return changes;
}

export function buildCompareGovernanceDiffView(input: {
  readonly baselineManifest: CompareManifestGovernanceSnapshot;
  readonly targetManifest: CompareManifestGovernanceSnapshot;
  readonly currentEffective: CompareEffectiveGovernanceSnapshot | null;
}): CompareGovernanceDiffView {
  const manifestRuleSetChanges = diffCompareManifestRuleSets(input.baselineManifest, input.targetManifest);

  const baselineKeys =
    input.baselineManifest.complianceRuleKeys.length > 0
      ? input.baselineManifest.complianceRuleKeys
      : input.currentEffective?.complianceRuleKeys ?? [];

  const targetKeys =
    input.targetManifest.complianceRuleKeys.length > 0
      ? input.targetManifest.complianceRuleKeys
      : input.currentEffective?.complianceRuleKeys ?? [];

  const complianceRuleKeyDiff = diffComplianceRuleKeys(baselineKeys, targetKeys);
  const materialComplianceRuleKeyChanges = complianceRuleKeyDiff.filter((row) => row.changeType !== "unchanged");

  const usesCurrentEffectiveOnly =
    input.baselineManifest.complianceRuleKeys.length === 0 &&
    input.targetManifest.complianceRuleKeys.length === 0 &&
    input.currentEffective !== null;

  const hasManifestGovernanceDelta =
    manifestRuleSetChanges.length > 0 ||
    (input.baselineManifest.complianceRuleKeys.length > 0 &&
      input.targetManifest.complianceRuleKeys.length > 0 &&
      materialComplianceRuleKeyChanges.length > 0);

  return {
    baselineManifest: input.baselineManifest,
    targetManifest: input.targetManifest,
    manifestRuleSetChanges,
    currentEffective: input.currentEffective,
    usesCurrentEffectiveOnly,
    complianceRuleKeyDiff,
    materialComplianceRuleKeyChanges,
    hasManifestGovernanceDelta,
  };
}
