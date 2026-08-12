import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);
const showcaseGraphBase = `/insights/evidence-graph?runId=${showcaseRunEnc}`;
const showcaseFindingsHref = `/governance/findings?runId=${showcaseRunEnc}`;

export type StandardsRuleRow = {
  readonly ruleKey: string;
  readonly ruleName: string;
  readonly standardFramework: string;
  readonly category: string;
  readonly severity: string;
  readonly enforcementMode: string;
  readonly sourcePolicyPack: string;
  readonly linkedFindingsLabel: string | null;
  readonly linkedFindingsHref: string | null;
  readonly evidenceHref: string | null;
};

type KnownRulePresentation = Omit<StandardsRuleRow, "ruleKey">;

const primaryPackLabel = policyPackBuyerLabel("healthcare-claims-v3", "3.4.1");

const KNOWN_RULE_PRESENTATION: Readonly<Record<string, KnownRulePresentation>> = {
  "phi.minimization.intake": {
    ruleName: "PHI minimization required",
    standardFramework: "HIPAA Privacy",
    category: "Privacy",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: "1 finding",
    linkedFindingsHref: showcaseFindingsHref,
    evidenceHref: `${showcaseGraphBase}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`,
  },
  "claims.intake.boundary": {
    ruleName: "Trust boundary for claims intake",
    standardFramework: "Internal architecture baseline",
    category: "Security",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: showcaseGraphBase,
  },
  "irs.1075.access.logging": {
    ruleName: "IRS 1075 access logging",
    standardFramework: "IRS 1075",
    category: "Security",
    severity: "Medium",
    enforcementMode: "Required",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  "change.management.approval": {
    ruleName: "Change-management approval required",
    standardFramework: "Internal change management",
    category: "Governance",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  "encryption.regulated.data": {
    ruleName: "Encryption required for regulated data",
    standardFramework: "HIPAA Security",
    category: "Security",
    severity: "High",
    enforcementMode: "Required",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: null,
    linkedFindingsHref: null,
    evidenceHref: null,
  },
  "risk.owner.accepted": {
    ruleName: "Owner required for accepted risk",
    standardFramework: "Internal risk governance",
    category: "Governance",
    severity: "Medium",
    enforcementMode: "Advisory",
    sourcePolicyPack: primaryPackLabel,
    linkedFindingsLabel: "1 finding",
    linkedFindingsHref: showcaseFindingsHref,
    evidenceHref: null,
  },
};

const SHOWCASE_RULE_KEYS: readonly string[] = [
  "phi.minimization.intake",
  "irs.1075.access.logging",
  "change.management.approval",
  "encryption.regulated.data",
  "risk.owner.accepted",
];

function humanizeRuleKey(ruleKey: string): string {
  return ruleKey
    .split(/[./_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function resolveSourcePackLabel(
  data: EffectiveGovernanceResolutionResult | null,
  ruleKey: string,
): string {
  const decision = data?.decisions.find((row) => row.itemKey === ruleKey);

  if (decision !== undefined && decision.winningPolicyPackName.trim().length > 0) {
    return decision.winningPolicyPackName;
  }

  return primaryPackLabel;
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

export type StandardsRulesSummary = {
  readonly standardsInScope: number;
  readonly rulesEnforced: number;
  readonly findingsLinked: number;
  readonly primaryPolicyPack: string;
};

export function buildStandardsRulesSummary(rows: readonly StandardsRuleRow[]): StandardsRulesSummary {
  const standards = new Set(rows.map((row) => row.standardFramework));
  const findingsLinked = rows.filter((row) => row.linkedFindingsHref !== null).length;
  const primaryPolicyPack = rows[0]?.sourcePolicyPack ?? primaryPackLabel;

  return {
    standardsInScope: standards.size,
    rulesEnforced: rows.length,
    findingsLinked,
    primaryPolicyPack,
  };
}

export type StandardsRulesFilterState = {
  readonly searchQuery: string;
  readonly standardFramework: string;
  readonly severity: string;
  readonly enforcementMode: string;
  readonly sourcePolicyPack: string;
  readonly linkedFindings: "all" | "linked" | "unlinked";
};

export const EMPTY_STANDARDS_RULES_FILTER_STATE: StandardsRulesFilterState = {
  searchQuery: "",
  standardFramework: "all",
  severity: "all",
  enforcementMode: "all",
  sourcePolicyPack: "all",
  linkedFindings: "all",
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
