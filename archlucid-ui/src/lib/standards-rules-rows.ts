import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";

import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";

import { inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";

import {

  findFocusedPilotShowcaseRuleSeed,

  focusedPilotShowcasePolicyPackHref,

  FOCUSED_PILOT_SHOWCASE_RULE_SEEDS,

} from "@/lib/standards-rules-focused-pilot-showcase";

import {
  resolveBundledPolicyPackProvenanceLabel,
  STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL,
} from "@/lib/standards-rules-policy-pack-provenance";



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



function resolvePolicyPackDetailHref(policyPackId: string): string | null {

  const trimmedId = policyPackId.trim();



  if (trimmedId.length === 0) {

    return null;

  }



  return policyPackBuyerGovernanceDetailHref(trimmedId) ?? governancePolicyPackDetailPath(trimmedId);

}



function findResolutionDecision(

  data: EffectiveGovernanceResolutionResult | null,

  ruleKey: string,

) {

  return data?.decisions.find((row) => row.itemKey === ruleKey);

}



function resolveSourcePackLabel(

  data: EffectiveGovernanceResolutionResult | null,

  ruleKey: string,

): string {

  const decision = findResolutionDecision(data, ruleKey);



  if (decision !== undefined && decision.winningPolicyPackName.trim().length > 0) {

    return decision.winningPolicyPackName;

  }



  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);



  if (showcaseSeed !== undefined) {

    return showcaseSeed.sourcePolicyPack;

  }



  return inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey) ?? "Workspace governance";

}



function resolveSourcePackHref(

  data: EffectiveGovernanceResolutionResult | null,

  ruleKey: string,

): string | null {

  const decision = findResolutionDecision(data, ruleKey);

  const packId = decision?.winningPolicyPackId.trim() ?? "";



  if (packId.length > 0) {

    return resolvePolicyPackDetailHref(packId);

  }



  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);



  if (showcaseSeed !== undefined) {

    return focusedPilotShowcasePolicyPackHref(showcaseSeed.bundledPackSlug);

  }



  const inferredPackName = inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey);



  if (inferredPackName !== null) {

    const matchingSeed = FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.find((seed) => seed.sourcePolicyPack === inferredPackName);



    if (matchingSeed !== undefined) {

      return focusedPilotShowcasePolicyPackHref(matchingSeed.bundledPackSlug);

    }

  }



  return null;

}



const PLATFORM_DEFAULT_PROVENANCE_LABEL = STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL;



export function resolveStandardsRulesPolicyPackProvenanceLabel(input: {

  readonly ruleKey: string;

  readonly policyPackId?: string | null;

  readonly data?: EffectiveGovernanceResolutionResult | null;

}): string | null {

  const fromRuleKey = resolveSourcePackProvenanceLabel(input.data ?? null, input.ruleKey);



  if (fromRuleKey !== null) {

    return fromRuleKey;

  }



  const packId = input.policyPackId?.trim() ?? "";



  if (packId.length > 0) {

    return resolveBundledPolicyPackProvenanceLabel(packId);

  }



  return null;

}



function resolveSourcePackProvenanceLabel(

  data: EffectiveGovernanceResolutionResult | null,

  ruleKey: string,

): string | null {

  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);



  if (showcaseSeed !== undefined) {

    return PLATFORM_DEFAULT_PROVENANCE_LABEL;

  }



  const inferredPackName = inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey);



  if (inferredPackName !== null) {

    const matchingSeed = FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.find((seed) => seed.sourcePolicyPack === inferredPackName);



    if (matchingSeed !== undefined) {

      return PLATFORM_DEFAULT_PROVENANCE_LABEL;

    }

  }



  const decision = findResolutionDecision(data, ruleKey);



  if (decision !== undefined) {

    const fromPackId = resolveBundledPolicyPackProvenanceLabel(decision.winningPolicyPackId);



    if (fromPackId !== null) {

      return fromPackId;

    }

  }



  return null;

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

    standardFramework: "Workspace governance",

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



export type StandardsRulesSummary = {

  readonly standardsInScope: number;

  readonly rulesEnforced: number;

  readonly rulesWithLinkedFindings: number;

  readonly evidencedRules: number;

  readonly evidenceCoverageLabel: string;

  readonly contributingPolicyPacks: readonly StandardsRulesContributingPolicyPack[];

};



export function buildStandardsRulesSummary(rows: readonly StandardsRuleRow[]): StandardsRulesSummary {

  const standards = new Set(rows.map((row) => row.standardFramework));

  const rulesWithLinkedFindings = rows.filter((row) => row.linkedFindingsHref !== null).length;

  const evidencedRules = rows.filter((row) => standardsRuleHasEvidence(row)).length;

  const evidenceCoverageLabel =

    rows.length === 0 ? "0%" : `${Math.round((evidencedRules / rows.length) * 100)}%`;



  return {

    standardsInScope: standards.size,

    rulesEnforced: rows.length,

    rulesWithLinkedFindings,

    evidencedRules,

    evidenceCoverageLabel,

    contributingPolicyPacks: collectContributingPolicyPacks(rows),

  };

}



export type StandardsRulesFilterState = {

  readonly searchQuery: string;

  readonly standardFramework: string;

  readonly severity: string;

  readonly enforcementMode: string;

  readonly sourcePolicyPack: string;

  readonly linkedFindings: "all" | "linked" | "unlinked";

  readonly evidenceCoverage: "all" | "evidenced" | "unevidenced";

};



export const EMPTY_STANDARDS_RULES_FILTER_STATE: StandardsRulesFilterState = {

  searchQuery: "",

  standardFramework: "all",

  severity: "all",

  enforcementMode: "all",

  sourcePolicyPack: "all",

  linkedFindings: "all",

  evidenceCoverage: "all",

};



export function filterStandardsRuleRows(

  rows: readonly StandardsRuleRow[],

  filters: StandardsRulesFilterState,

): readonly StandardsRuleRow[] {

  const query = filters.searchQuery.trim().toLowerCase();



  return rows.filter((row) => {

    if (query.length > 0) {

      const haystack = [

        row.ruleName,

        row.standardFramework,

        row.category,

        row.severity,

        row.enforcementMode,

        row.sourcePolicyPack,

      ]

        .join(" ")

        .toLowerCase();



      if (!haystack.includes(query)) {

        return false;

      }

    }



    if (filters.standardFramework !== "all" && row.standardFramework !== filters.standardFramework) {

      return false;

    }



    if (filters.severity !== "all" && row.severity !== filters.severity) {

      return false;

    }



    if (filters.enforcementMode !== "all" && row.enforcementMode !== filters.enforcementMode) {

      return false;

    }



    if (filters.sourcePolicyPack !== "all" && row.sourcePolicyPack !== filters.sourcePolicyPack) {

      return false;

    }



    if (filters.linkedFindings === "linked" && row.linkedFindingsHref === null) {

      return false;

    }



    if (filters.linkedFindings === "unlinked" && row.linkedFindingsHref !== null) {

      return false;

    }



    if (filters.evidenceCoverage === "evidenced" && !standardsRuleHasEvidence(row)) {

      return false;

    }



    if (filters.evidenceCoverage === "unevidenced" && standardsRuleHasEvidence(row)) {

      return false;

    }



    return true;

  });

}



export function collectStandardsRulesFilterOptions(rows: readonly StandardsRuleRow[]): {

  readonly standards: readonly string[];

  readonly severities: readonly string[];

  readonly enforcementModes: readonly string[];

  readonly policyPacks: readonly string[];

} {

  return {

    standards: [...new Set(rows.map((row) => row.standardFramework))].sort(),

    severities: [...new Set(rows.map((row) => row.severity))].sort(),

    enforcementModes: [...new Set(rows.map((row) => row.enforcementMode))].sort(),

    policyPacks: [...new Set(rows.map((row) => row.sourcePolicyPack))].sort(),

  };

}


