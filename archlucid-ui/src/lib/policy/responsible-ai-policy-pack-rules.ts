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

export type ResolveResponsibleAiPolicyRuleRowsOptions = {
  readonly hasPackRecord: boolean;
  /** When false, omit the Responsible AI platform template when published content is missing. */
  readonly usePlatformTemplateFallback?: boolean;
};

const RULE_KEYS_ONLY_SEVERITY_QUALIFIER =
  "Published pack lists rule keys only; severity is not specified in pack metadata.";

const PUBLISHED_CONTENT_UNAVAILABLE_QUALIFIER =
  "Published pack content unavailable — no rule rows are shown until content loads.";

const PUBLISHED_CONTENT_NO_RULE_KEYS_QUALIFIER =
  "Published pack has no compliance rule keys in pack content.";

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

/** Resolves rule rows from published pack content, or platform template baseline when content is not loaded. */
export function resolveResponsibleAiPolicyRuleRows(
  packContent: PolicyPackContentDocument | null,
  options: ResolveResponsibleAiPolicyRuleRowsOptions,
): ResponsibleAiRulesResolution {
  const usePlatformTemplateFallback = options.usePlatformTemplateFallback ?? true;

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
            evidenceExpected: rule.evidenceHints.length > 0 ? rule.evidenceHints.join(", ") : "—",
          })),
          rulesSourceQualifier: null,
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
          evidenceExpected: "—",
        })),
        rulesSourceQualifier: RULE_KEYS_ONLY_SEVERITY_QUALIFIER,
      };
    }

    return {
      rows: [],
      rulesSourceQualifier: PUBLISHED_CONTENT_NO_RULE_KEYS_QUALIFIER,
    };
  }

  if (!options.hasPackRecord) {
    if (!usePlatformTemplateFallback) {
      return { rows: [], rulesSourceQualifier: null };
    }

    return {
      rows: templateRowsToTableRows(RESPONSIBLE_AI_POLICY_RULE_ROWS),
      rulesSourceQualifier: "Platform template baseline",
    };
  }

  if (!usePlatformTemplateFallback) {
    return {
      rows: [],
      rulesSourceQualifier: PUBLISHED_CONTENT_UNAVAILABLE_QUALIFIER,
    };
  }

  return {
    rows: templateRowsToTableRows(RESPONSIBLE_AI_POLICY_RULE_ROWS),
    rulesSourceQualifier: "Published pack content unavailable — platform template baseline",
  };
}
