import { extractCuratedRulesFromPackMetadata } from "@/lib/policy/policy-pack-curated-rules-v1";
import {
  HEALTHCARE_CLAIMS_POLICY_PACK_RULE_ROWS,
  type HealthcareClaimsPolicyPackRuleRow,
} from "@/lib/policy/healthcare-claims-policy-pack-rules-data";
import type { ResponsibleAiRulesResolution } from "@/lib/policy/responsible-ai-policy-pack-rules";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

export type ResolveHealthcareClaimsPolicyRuleRowsOptions = {
  readonly hasPackRecord: boolean;
  readonly packEnabled: boolean;
};

function humanizeRuleKey(ruleKey: string): string {
  return ruleKey
    .split(/[./_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function templateRowsToTableRows(
  rows: readonly HealthcareClaimsPolicyPackRuleRow[],
): ResponsibleAiRulesResolution["rows"] {
  return rows.map((row) => ({
    ruleKey: row.ruleKey,
    ruleName: row.ruleName,
    severity: row.severity,
    requirement: row.requirement,
    evidenceExpected: row.evidenceExpected,
  }));
}

function enforcedQualifier(packEnabled: boolean): string | null {
  if (packEnabled) {
    return "Rules below are enforced in this workspace when the pack is enabled.";
  }

  return "Published rules — enforcement applies only when this pack is enabled in the workspace.";
}

/** Resolves healthcare claims rule rows from API pack content or bundled template baseline. */
export function resolveHealthcareClaimsPolicyRuleRows(
  packContent: PolicyPackContentDocument | null,
  options: ResolveHealthcareClaimsPolicyRuleRowsOptions,
): ResponsibleAiRulesResolution {
  const templateBaseline = templateRowsToTableRows(HEALTHCARE_CLAIMS_POLICY_PACK_RULE_ROWS);

  if (packContent != null) {
    const keys = packContent.complianceRuleKeys?.filter((key) => (key ?? "").trim().length > 0) ?? [];
    const curated = extractCuratedRulesFromPackMetadata(packContent.metadata);

    if (curated !== null && curated.rules.length > 0) {
      const keySet = new Set(keys.map((key) => key.trim().toLowerCase()));
      const filtered =
        keySet.size === 0
          ? curated.rules
          : curated.rules.filter((rule) => keySet.has(rule.id.trim().toLowerCase()));

      if (filtered.length > 0) {
        return {
          rows: filtered.map((rule) => ({
            ruleKey: rule.id,
            ruleName: rule.title.trim().length > 0 ? rule.title : humanizeRuleKey(rule.id),
            severity: rule.severity,
            requirement: rule.description,
            evidenceExpected: rule.evidenceHints.length > 0 ? rule.evidenceHints.join(", ") : " — ",
          })),
          rulesSourceQualifier: enforcedQualifier(options.packEnabled),
        };
      }
    }

    if (keys.length > 0) {
      return {
        rows: keys.map((key) => ({
          ruleKey: key.trim(),
          ruleName: humanizeRuleKey(key),
          severity: "Low",
          requirement: "Compliance rule defined in published pack content.",
          evidenceExpected: " — ",
        })),
        rulesSourceQualifier: `${enforcedQualifier(options.packEnabled) ?? ""} Severity is not specified in pack metadata.`,
      };
    }
  }

  if (!options.hasPackRecord) {
    return {
      rows: templateBaseline,
      rulesSourceQualifier: "Bundled template baseline — not a live workspace publish.",
    };
  }

  if (packContent == null) {
    return {
      rows: templateBaseline,
      rulesSourceQualifier: "Published pack content unavailable — bundled template baseline.",
    };
  }

  return {
    rows: [],
    rulesSourceQualifier: "Published pack has no compliance rule keys in pack content.",
  };
}
