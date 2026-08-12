import type { components } from "@/lib/openapi-schemas";
import type { PolicyPackContentDocument, PolicyPackVersion } from "@/types/policy-packs";

import { mergeComplianceRuleKeySets } from "@/lib/policy/policy-pack-compliance-rule-key-diff";

export type PolicyImpactGatePosture = "allow" | "block-critical" | "block-warning";

export type PolicyImpactPreviewGateSummary = {
  readonly posture: PolicyImpactGatePosture;
  readonly label: string;
  readonly blocked: boolean;
  readonly warnOnly: boolean;
  readonly failedCheckCount: number;
};

export function resolveLatestPublishedVersion(versions: readonly PolicyPackVersion[]): PolicyPackVersion | null {
  const published = versions.filter((version) => version.isPublished === true);

  if (published.length === 0) {
    return null;
  }

  return published[published.length - 1] ?? null;
}

export function parsePolicyPackContentDocument(contentJson: string | undefined): PolicyPackContentDocument | null {
  const raw = contentJson?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw) as PolicyPackContentDocument;
  } catch {
    return null;
  }
}

/** After snapshot: union of current effective keys with a proposed pack assignment (read-only preview). */
export function buildAfterAssignmentComplianceRuleKeys(
  effectiveContent: PolicyPackContentDocument | null,
  proposedContent: PolicyPackContentDocument | null,
): string[] {
  const baseline = effectiveContent?.complianceRuleKeys ?? [];
  const proposed = proposedContent?.complianceRuleKeys ?? [];

  return mergeComplianceRuleKeySets(baseline, proposed);
}

export function buildPolicyImpactPreviewSimulateRequest(
  runId: string,
  posture: PolicyImpactGatePosture,
  options?: {
    readonly proposedContent?: PolicyPackContentDocument | null;
    readonly proposedPolicyPackId?: string | null;
  },
): components["schemas"]["PolicyPackSimulateRequest"] {
  const trimmedRunId = runId.trim();
  const proposedPolicyPackId = options?.proposedPolicyPackId?.trim() ?? "";
  const body: components["schemas"]["PolicyPackSimulateRequest"] = {
    runId: trimmedRunId,
    blockCommitOnCritical: posture !== "allow",
  };

  if (posture === "block-warning") {
    body.blockCommitMinimumSeverity = 1;
  }

  if (options?.proposedContent !== null && options?.proposedContent !== undefined) {
    body.content = options.proposedContent;
  }

  if (/^[0-9a-fA-F-]{36}$/.test(proposedPolicyPackId)) {
    body.proposedPolicyPackId = proposedPolicyPackId;
  }

  return body;
}

export function summarizePolicyImpactGateResult(
  posture: PolicyImpactGatePosture,
  result: components["schemas"]["PolicyPackGovernanceDryRunResult"],
): PolicyImpactPreviewGateSummary {
  const blocked = result.gateResult?.blocked === true;
  const warnOnly = result.gateResult?.warnOnly === true;
  const failedCheckCount = result.failedChecks?.length ?? 0;

  if (posture === "allow") {
    return {
      posture,
      label: "Current enforcement (allow path)",
      blocked,
      warnOnly,
      failedCheckCount,
    };
  }

  if (posture === "block-warning") {
    return {
      posture,
      label: "Stricter enforcement (block on Warning+)",
      blocked,
      warnOnly,
      failedCheckCount,
    };
  }

  return {
    posture,
    label: "Stricter enforcement (block on Critical)",
    blocked,
    warnOnly,
    failedCheckCount,
  };
}
