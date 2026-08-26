import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import {
  FOCUSED_PILOT_SHOWCASE_RULE_SEEDS,
} from "@/lib/standards-rules-focused-pilot-showcase";

import {
  resolveSourcePackHref,
  resolveSourcePackLabel,
  resolveSourcePackProvenanceLabel,
} from "./standards-rules-provenance";

export type StandardsRuleRow = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly standardFramework: string;
  readonly category: string;
  readonly severity: string;
  readonly enforcementMode: string;
  readonly sourcePolicyPack: string;
  readonly sourcePolicyPackHref: string | null;
  readonly sourcePolicyPackProvenanceLabel: string | null;
  readonly linkedFindingsLabel: string | null;
  readonly linkedFindingsHref: string | null;
  readonly evidenceHref: string | null;
};

export type StandardsRulesContributingPolicyPack = {
  readonly label: string;
  readonly href: string | null;
  readonly provenanceLabel: string | null;
};

export function standardsRuleHasEvidence(row: StandardsRuleRow): boolean {
  return row.evidenceHref !== null;
}

type KnownRulePresentation = Omit<
  StandardsRuleRow,
  "ruleKey" | "sourcePolicyPack" | "sourcePolicyPackHref" | "sourcePolicyPackProvenanceLabel"
>;

const KNOWN_RULE_PRESENTATION: Readonly<Record<string, KnownRulePresentation>> = Object.fromEntries(
  FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.map((seed) => [
    seed.ruleKey,
    {
      ruleName: seed.ruleName,
      standardFramework: seed.standardFramework,
      category: seed.category,
      severity: seed.severity,
      enforcementMode: seed.enforcementMode,
      linkedFindingsLabel: seed.linkedFindingsLabel,
      linkedFindingsHref: seed.linkedFindingsHref,
      evidenceHref: seed.evidenceHref,
    },
  ]),
);

const SHOWCASE_RULE_KEYS: readonly string[] = FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.map((seed) => seed.ruleKey);

function humanizeRuleKey(ruleKey: string): string {
  return ruleKey
    .split(/[./_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mapRuleKey(
  ruleKey: string,
  data: EffectiveGovernanceResolutionResult | null,
): StandardsRuleRow {
  const trimmedKey = ruleKey.trim();
  const known = KNOWN_RULE_PRESENTATION[trimmedKey];

  if (known !== undefined) {
    return {
      ruleKey: trimmedKey,
      ...known,
      sourcePolicyPack: resolveSourcePackLabel(data, trimmedKey),
      sourcePolicyPackHref: resolveSourcePackHref(data, trimmedKey),
      sourcePolicyPackProvenanceLabel: resolveSourcePackProvenanceLabel(data, trimmedKey),
    };
  }

  return {
    ruleKey: trimmedKey,
    ruleName: humanizeRuleKey(trimmedKey),
    standardFramework: "Workspace policy",
    category: "Compliance",
    severity: "Medium",
    enforcementMode: "Required",
    sourcePolicyPack: resolveSourcePackLabel(data, trimmedKey),
    sourcePolicyPackHref: resolveSourcePackHref(data, trimmedKey),
    sourcePolicyPackProvenanceLabel: resolveSourcePackProvenanceLabel(data, trimmedKey),
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  };
}

export function buildStandardsRuleRows(
  data: EffectiveGovernanceResolutionResult | null,
  options?: { readonly useShowcaseFallback?: boolean },
): readonly StandardsRuleRow[] {
  const keys =
    data?.effectiveContent?.complianceRuleKeys?.filter((key) => (key ?? "").trim().length > 0) ?? [];

  if (keys.length === 0 && options?.useShowcaseFallback === true) {
    return SHOWCASE_RULE_KEYS.map((ruleKey) => mapRuleKey(ruleKey, data));
  }

  return keys.map((ruleKey) => mapRuleKey(ruleKey, data));
}

export function collectContributingPolicyPacks(
  rows: readonly StandardsRuleRow[],
): readonly StandardsRulesContributingPolicyPack[] {
  const seen = new Set<string>();
  const packs: StandardsRulesContributingPolicyPack[] = [];

  for (const row of rows) {
    if (seen.has(row.sourcePolicyPack)) {
      continue;
    }

    seen.add(row.sourcePolicyPack);
    packs.push({
      label: row.sourcePolicyPack,
      href: row.sourcePolicyPackHref,
      provenanceLabel: row.sourcePolicyPackProvenanceLabel,
    });
  }

  return packs;
}
