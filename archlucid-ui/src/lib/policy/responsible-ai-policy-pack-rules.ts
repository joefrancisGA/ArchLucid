import { extractCuratedRulesFromPackMetadata } from "@/lib/policy/policy-pack-curated-rules-v1";
import {
  RESPONSIBLE_AI_POLICY_RULE_ROWS,
  type ResponsibleAiPolicyRuleRow,
} from "@/lib/responsible-ai-policy-pack-detail-content";
import type { PolicyPackContentDocument } from "@/types/policy-packs";

export type ResponsibleAiRuleTableRow = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly severity: "Critical" | "High" | "Medium" | "Low";
  readonly requirement: string;
  readonly evidenceExpected: string;
};

export type ResponsibleAiRulesResolution = {
  readonly rows: readonly ResponsibleAiRuleTableRow[];
  readonly rulesSourceQualifier: string | null;
};

function humanizeRuleKey(ruleKey: string): string {
  return ruleKey
    .split(/[./_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function templateRowsToTableRows(rows: readonly ResponsibleAiPolicyRuleRow[]): ResponsibleAiRuleTableRow[] {
  return rows.map((row, index) => ({
    ruleKey: `template-${index}`,
    ruleName: row.ruleName,
    severity: row.severity,
    requirement: row.requirement,
    evidenceExpected: row.evidenceExpected,
  }));
}

/** Resolves rule rows from published pack content, or template baseline for sample packs. */
export function resolveResponsibleAiPolicyRuleRows(
  packContent: PolicyPackContentDocument | null,
  options: { readonly isSample: boolean; readonly hasPackRecord: boolean },
): ResponsibleAiRulesResolution {
  if (packContent != null) {
    const keys = packContent.complianceRuleKeys?.filter((key) => (key ?? "").trim().length > 0) ?? [];
    const curated = extractCuratedRulesFromPackMetadata(packContent.metadata);

    if (curated !== null && curated.rules.length > 0) {
      const keySet = new Set(keys.map((key) => key.trim().toLowerCase()));
      const filtered =
        keySet.size === 0
          ? curated.rules
          : curated.rules.filter((rule) => keySet.has(rule.id.trim().toLowerCase()));

      return {
        rows: filtered.map((rule) => ({
          ruleKey: rule.id,
          ruleName: rule.title.trim().length > 0 ? rule.title : humanizeRuleKey(rule.id),
          severity: rule.severity,
          requirement: rule.description,
          evidenceExpected: rule.evidenceHints.length > 0 ? rule.evidenceHints.join(", ") : "—",
        })),
        rulesSourceQualifier: null,
      };
    }

    if (keys.length > 0) {
      return {
        rows: keys.map((key) => ({
          ruleKey: key.trim(),
          ruleName: humanizeRuleKey(key),
          severity: "Medium",
          requirement: "Compliance rule defined in published pack content.",
          evidenceExpected: "—",
        })),
        rulesSourceQualifier: null,
      };
    }
  }

  if (options.isSample || !options.hasPackRecord) {
    return {
      rows: templateRowsToTableRows(RESPONSIBLE_AI_POLICY_RULE_ROWS),
      rulesSourceQualifier: "Platform template baseline",
    };
  }

  return {
    rows: templateRowsToTableRows(RESPONSIBLE_AI_POLICY_RULE_ROWS),
    rulesSourceQualifier: "Published pack content unavailable — platform template baseline",
  };
}
