import {
  extractCuratedRulesFromPackMetadata,
  type CuratedRuleRow,
} from "@/lib/policy/policy-pack-curated-rules-v1";
import { inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import type { ResolvedPolicyPack } from "@/types/policy-packs";

export type PolicyRulePreview = {
  readonly ruleId: string;
  readonly ruleTitle: string;
  readonly description: string;
  readonly remediationGuidance: string;
  readonly severity: string | null;
  readonly packId: string;
  readonly packName: string;
  readonly packVersion: string;
  readonly evidenceHints: readonly string[];
  readonly hasCuratedRuleText: boolean;
};

function nonEmptyString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function parseContentDocument(contentJson: string): PolicyPackContentDocument | null {
  try {
    const parsed: unknown = JSON.parse(contentJson);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as PolicyPackContentDocument;
  } catch {
    return null;
  }
}

function curatedRuleToPreview(
  rule: CuratedRuleRow,
  pack: ResolvedPolicyPack,
): PolicyRulePreview {
  return {
    ruleId: rule.id,
    ruleTitle: rule.title.length > 0 ? rule.title : rule.id,
    description: rule.description,
    remediationGuidance: rule.remediationGuidance,
    severity: rule.severity,
    packId: pack.policyPackId,
    packName: pack.name,
    packVersion: pack.version,
    evidenceHints: rule.evidenceHints,
    hasCuratedRuleText: rule.description.trim().length > 0 || rule.remediationGuidance.trim().length > 0,
  };
}

/** Resolves curated rule text from effective policy pack content for inline preview UI. */
export function lookupPolicyRulePreviewInEffectivePacks(
  ruleId: string,
  effectivePacks: readonly ResolvedPolicyPack[],
): PolicyRulePreview | null {
  const normalizedRuleId = nonEmptyString(ruleId)?.toLowerCase() ?? "";

  if (normalizedRuleId.length === 0) {
    return null;
  }

  for (const pack of effectivePacks) {
    const document = parseContentDocument(pack.contentJson);

    if (document === null) {
      continue;
    }

    const curated = extractCuratedRulesFromPackMetadata(document.metadata);

    if (curated === null) {
      continue;
    }

    for (const rule of curated.rules) {
      if (rule.id.trim().toLowerCase() === normalizedRuleId) {
        return curatedRuleToPreview(rule, pack);
      }
    }
  }

  return null;
}

/** Fallback preview when curated rule text is not available in effective pack content. */
export function buildPolicyRulePreviewFallback(input: {
  readonly ruleId: string;
  readonly ruleLabel?: string | null;
  readonly packId?: string | null;
  readonly packName?: string | null;
  readonly packVersion?: string | null;
}): PolicyRulePreview {
  const ruleId = nonEmptyString(input.ruleId) ?? "unknown-rule";
  const ruleLabel = nonEmptyString(input.ruleLabel);
  const packId = nonEmptyString(input.packId);
  const explicitPackName = nonEmptyString(input.packName);
  const inferredPackName = inferPolicyPackDisplayNameFromComplianceRuleKey(ruleId);
  const packName = explicitPackName ?? inferredPackName ?? packId ?? "Policy pack";
  const packVersion = nonEmptyString(input.packVersion) ?? "";

  return {
    ruleId,
    ruleTitle: ruleLabel ?? ruleId,
    description:
      "Full rule text is stored in the assigned policy pack. Open Policy Packs to inspect the rule definition and thresholds.",
    remediationGuidance: "",
    severity: null,
    packId: packId ?? packName,
    packName,
    packVersion,
    evidenceHints: [],
    hasCuratedRuleText: false,
  };
}
