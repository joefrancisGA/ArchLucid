import {
  extractCuratedRulesFromPackMetadata,
  type CuratedRuleRow,
} from "@/lib/policy/policy-pack-curated-rules-v1";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import type { ResolvedPolicyPack } from "@/types/policy-packs";

export const POLICY_RULE_ID_NOT_STORED = "Rule id was not stored." as const;

export const POLICY_PACK_NAME_NOT_STORED = "Pack name was not stored." as const;

export const POLICY_REMEDIATION_GUIDANCE_NOT_STORED = "Remediation guidance was not stored." as const;

export function isStoredPolicyRuleId(ruleId: string): boolean {
  const trimmed = ruleId.trim();

  return trimmed.length > 0 && trimmed !== POLICY_RULE_ID_NOT_STORED && trimmed !== "unknown-rule";
}

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
    packId: pack.policyPackId ?? "",
    packName: pack.name ?? "",
    packVersion: pack.version ?? "",
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
    const document = parseContentDocument(pack.contentJson ?? "");

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
  const storedRuleId = nonEmptyString(input.ruleId);
  const ruleId = storedRuleId ?? POLICY_RULE_ID_NOT_STORED;
  const ruleLabel = nonEmptyString(input.ruleLabel);
  const packId = nonEmptyString(input.packId);
  const explicitPackName = nonEmptyString(input.packName);
  const packName = explicitPackName ?? POLICY_PACK_NAME_NOT_STORED;
  const packVersion = nonEmptyString(input.packVersion) ?? "Policy pack version was not stored.";

  return {
    ruleId,
    ruleTitle: ruleLabel ?? (storedRuleId ?? POLICY_RULE_ID_NOT_STORED),
    description:
      "Curated rule text was not stored on the effective policy pack. Open policy packs to inspect the rule definition and thresholds.",
    remediationGuidance: "",
    severity: null,
    packId: packId ?? packName,
    packName,
    packVersion,
    evidenceHints: [],
    hasCuratedRuleText: false,
  };
}
